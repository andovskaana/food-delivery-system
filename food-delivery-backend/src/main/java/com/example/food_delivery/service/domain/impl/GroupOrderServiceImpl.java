package com.example.food_delivery.service.domain.impl;

import com.example.food_delivery.dto.domain.GroupOrderDto;
import com.example.food_delivery.model.domain.*;
import com.example.food_delivery.model.enums.*;
import com.example.food_delivery.model.mapper.GroupOrderMappers;
import com.example.food_delivery.repository.GroupOrderItemAssignmentRepository;
import com.example.food_delivery.repository.GroupOrderParticipantRepository;
import com.example.food_delivery.repository.GroupOrderRepository;
import com.example.food_delivery.repository.GroupPaymentRepository;
import com.example.food_delivery.repository.OrderRepository;
import com.example.food_delivery.repository.UserRepository;
import com.example.food_delivery.service.domain.CourierAssignmentService;
import com.example.food_delivery.service.domain.GroupOrderService;
import com.example.food_delivery.service.domain.OrderService;
import com.example.food_delivery.service.domain.OrderTotalsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;

@Service
public class GroupOrderServiceImpl implements GroupOrderService {

    private final GroupOrderRepository groupOrderRepository;
    private final GroupOrderParticipantRepository participantRepository;
    private final GroupOrderItemAssignmentRepository itemAssignmentRepository;
    private final GroupPaymentRepository groupPaymentRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;            // <-- ADDED (needed to return items to cart)
    private final OrderService orderService;
    private final OrderTotalsService totalsService;
    private final CourierAssignmentService courierAssignmentService;

    @Value("${group.max-split-count:10}")
    private int maxSplitCount;

    // TTL is now configurable. Default 24h. Set app.group.ttl-hours in application.properties.
    @Value("${app.group.ttl-hours:24}")
    private long groupTtlHours;

    public GroupOrderServiceImpl(GroupOrderRepository groupOrderRepository,
                                 GroupOrderParticipantRepository participantRepository,
                                 GroupOrderItemAssignmentRepository itemAssignmentRepository,
                                 GroupPaymentRepository groupPaymentRepository,
                                 UserRepository userRepository,
                                 OrderRepository orderRepository,            // <-- ADDED
                                 OrderService orderService,
                                 OrderTotalsService totalsService,
                                 CourierAssignmentService courierAssignmentService) {
        this.groupOrderRepository = groupOrderRepository;
        this.participantRepository = participantRepository;
        this.itemAssignmentRepository = itemAssignmentRepository;
        this.groupPaymentRepository = groupPaymentRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;                              // <-- ADDED
        this.orderService = orderService;
        this.totalsService = totalsService;
        this.courierAssignmentService = courierAssignmentService;
    }

    @Override
    @Transactional
    public GroupOrder createGroupOrder(String username, int splitCount, GroupSplitType splitType) {
        if (splitCount < 2) {
            throw new IllegalArgumentException("Split count must be at least 2");
        }

        if (splitCount > maxSplitCount) {
            throw new IllegalArgumentException("Split count exceeds maximum allowed");
        }

        Order cart = orderService.findOrCreatePending(username);

        boolean hasItems =
                (cart.getItems() != null && !cart.getItems().isEmpty()) ||
                        (cart.getProducts() != null && !cart.getProducts().isEmpty());

        if (!hasItems) {
            throw new IllegalStateException("Cannot create a group order for an empty cart");
        }

        Optional<GroupOrder> existingGroupOrder = groupOrderRepository.findByOrderId(cart.getId());

        if (existingGroupOrder.isPresent()) {
            GroupOrder existing = existingGroupOrder.get();

            if (existing.getStatus() != GroupOrderStatus.CANCELLED &&
                    existing.getStatus() != GroupOrderStatus.EXPIRED) {
                return existing;
            }

            throw new IllegalStateException(
                    "A cancelled or expired group order already exists for this cart. Please clear the cart and create a new order."
            );
        }

        totalsService.setFeesAndRecalculate(cart, cart.getRestaurant());

        double totalAmount = cart.getTotal() != null ? cart.getTotal() : 0.0;

        User creator = userRepository.findByUsername(username).orElseThrow();

        // ===================================================================
        // RECONCILE WITH YOUR RUNNING BUILD:
        // If your running createGroupOrder marks the cart order as GROUP_OPEN
        // (so it leaves the customer's cart while the group is open), keep that:
        //     cart.setStatus(OrderStatus.GROUP_OPEN);
        //     orderRepository.save(cart);
        // The cancel logic below resets it back to PENDING either way, so it is
        // safe whether you keep GROUP_OPEN or leave the order PENDING.
        //
        // If your running build sets a split type (EQUAL / BY_ITEMS), set it on
        // the GroupOrder below where marked.
        // ===================================================================

        GroupOrder groupOrder = new GroupOrder();
        groupOrder.setOrder(cart);
        groupOrder.setCreatedBy(creator);
        groupOrder.setGroupCode(generateGroupCode());
        groupOrder.setInviteToken(UUID.randomUUID().toString());
        groupOrder.setSplitCount(splitCount);
        groupOrder.setTotalAmount(totalAmount);
        groupOrder.setPaidAmount(0.0);
        groupOrder.setStatus(GroupOrderStatus.WAITING_FOR_PARTICIPANTS);
        groupOrder.setSplitType(splitType != null ? splitType : GroupSplitType.EQUAL);

        // TTL: set explicitly from config so it no longer depends on the hidden
        // 2h fallback in GroupOrder.prePersist().
        Instant now = Instant.now();
        groupOrder.setCreatedAt(now);
        groupOrder.setExpiresAt(now.plus(groupTtlHours, ChronoUnit.HOURS));

        groupOrder = groupOrderRepository.save(groupOrder);

        GroupOrderParticipant creatorParticipant = new GroupOrderParticipant();
        creatorParticipant.setGroupOrder(groupOrder);
        creatorParticipant.setUser(creator);
        creatorParticipant.setDisplayName(creator.getUsername());
        creatorParticipant.setEmail(creator.getEmail());
        creatorParticipant.setAssignedAmount(calculateAssignedAmount(groupOrder, 0));
        creatorParticipant.setPaidAmount(0.0);
        creatorParticipant.setPaymentStatus(PaymentStatus.REQUIRES_ACTION);
        creatorParticipant.setPaymentToken(UUID.randomUUID().toString());
        creatorParticipant.setJoinedAt(Instant.now());

        creatorParticipant = participantRepository.save(creatorParticipant);
        groupOrder.getParticipants().add(creatorParticipant);

        return groupOrderRepository.save(groupOrder);
    }

    @Override
    public GroupOrder getGroupOrder(String groupCode) {
        GroupOrder groupOrder = groupOrderRepository.findByGroupCode(groupCode)
                .orElseThrow(() -> new IllegalArgumentException("Group order not found"));

        // Reflect expiry on READ so the UI status chip can't disagree with reality.
        if (isExpired(groupOrder) &&
                groupOrder.getStatus() != GroupOrderStatus.CANCELLED &&
                groupOrder.getStatus() != GroupOrderStatus.FULLY_PAID &&
                groupOrder.getStatus() != GroupOrderStatus.EXPIRED) {
            groupOrder.setStatus(GroupOrderStatus.EXPIRED);
            groupOrderRepository.save(groupOrder);
        }
        return groupOrder;
    }

    @Override
    @Transactional
    public GroupOrderParticipant joinGroupOrder(String groupCode,
                                                String displayName,
                                                String email,
                                                String username) {
        GroupOrder groupOrder = getGroupOrder(groupCode);

        if (isExpired(groupOrder)) {
            groupOrder.setStatus(GroupOrderStatus.EXPIRED);
            groupOrderRepository.save(groupOrder);
            throw new IllegalStateException("Group order has expired");
        }

        if (groupOrder.getStatus() == GroupOrderStatus.CANCELLED ||
                groupOrder.getStatus() == GroupOrderStatus.EXPIRED ||
                groupOrder.getStatus() == GroupOrderStatus.FULLY_PAID) {
            throw new IllegalStateException("Cannot join this group order");
        }

        long currentCount = participantRepository.countByGroupOrderId(groupOrder.getId());

        if (currentCount >= groupOrder.getSplitCount()) {
            throw new IllegalStateException("All participant slots are already filled");
        }

        GroupOrderParticipant participant = new GroupOrderParticipant();
        participant.setGroupOrder(groupOrder);

        if (username != null) {
            userRepository.findByUsername(username).ifPresent(participant::setUser);

            if (displayName == null || displayName.isBlank()) {
                displayName = username;
            }
        }

        if (displayName == null || displayName.isBlank()) {
            displayName = "Guest " + (currentCount + 1);
        }

        participant.setDisplayName(displayName);
        participant.setEmail(email);
        participant.setAssignedAmount(calculateAssignedAmount(groupOrder, currentCount));
        participant.setPaidAmount(0.0);
        participant.setPaymentStatus(PaymentStatus.REQUIRES_ACTION);
        participant.setPaymentToken(UUID.randomUUID().toString());
        participant.setJoinedAt(Instant.now());

        participant = participantRepository.save(participant);
        groupOrder.getParticipants().add(participant);

        if (groupOrder.getStatus() == GroupOrderStatus.WAITING_FOR_PARTICIPANTS) {
            groupOrder.setStatus(GroupOrderStatus.PARTIALLY_PAID);
            groupOrderRepository.save(groupOrder);
        }

        return participant;
    }

    @Override
    public GroupOrderParticipant getParticipantByToken(String paymentToken) {
        return participantRepository.findByPaymentToken(paymentToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid payment token"));
    }

    @Override
    @Transactional
    public GroupOrderParticipant payParticipant(String paymentToken) {
        GroupOrderParticipant participant = getParticipantByToken(paymentToken);
        GroupOrder groupOrder = participant.getGroupOrder();

        if (isExpired(groupOrder)) {
            groupOrder.setStatus(GroupOrderStatus.EXPIRED);
            groupOrderRepository.save(groupOrder);
            throw new IllegalStateException("Group order has expired");
        }

        if (groupOrder.getStatus() == GroupOrderStatus.CANCELLED ||
                groupOrder.getStatus() == GroupOrderStatus.EXPIRED) {
            throw new IllegalStateException("Group order is not active");
        }

        if (participant.getPaymentStatus() == PaymentStatus.CAPTURED) {
            throw new IllegalStateException("Participant has already paid");
        }

        GroupPayment payment = new GroupPayment();
        payment.setGroupOrder(groupOrder);
        payment.setParticipant(participant);
        payment.setAmount(participant.getAssignedAmount());
        payment.setProvider(PaymentProvider.CPAY);
        payment.setProviderPaymentId(
                "GROUP-CPAY-DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
        );
        payment.setStatus(PaymentStatus.CAPTURED);
        payment.setPaidAt(Instant.now());

        groupPaymentRepository.save(payment);

        participant.setPaymentStatus(PaymentStatus.CAPTURED);
        participant.setPaidAmount(participant.getAssignedAmount());
        participant.setPaidAt(Instant.now());

        participantRepository.save(participant);

        double currentPaidAmount = groupOrder.getPaidAmount() == null ? 0.0 : groupOrder.getPaidAmount();
        double newPaidAmount = currentPaidAmount + participant.getAssignedAmount();

        groupOrder.setPaidAmount(round2(newPaidAmount));

        boolean allRequiredParticipantsJoined =
                participantRepository.countByGroupOrderId(groupOrder.getId()) >= groupOrder.getSplitCount();

        boolean fullyPaidByAmount =
                Math.abs(groupOrder.getPaidAmount() - groupOrder.getTotalAmount()) < 0.01;

        boolean fullyPaidByParticipants =
                participantRepository.countByGroupOrderIdAndPaymentStatus(
                        groupOrder.getId(),
                        PaymentStatus.CAPTURED
                ) >= groupOrder.getSplitCount();

        if (allRequiredParticipantsJoined && fullyPaidByAmount && fullyPaidByParticipants) {
            groupOrder.setStatus(GroupOrderStatus.FULLY_PAID);
            groupOrder.setFinalizedAt(Instant.now());

            groupOrderRepository.save(groupOrder);

            finalizeUnderlyingOrder(groupOrder);
        } else {
            groupOrder.setStatus(GroupOrderStatus.PARTIALLY_PAID);
            groupOrderRepository.save(groupOrder);
        }

        return participant;
    }

    @Override
    @Transactional
    public GroupOrderParticipant failParticipantPayment(String paymentToken) {
        GroupOrderParticipant participant = getParticipantByToken(paymentToken);

        if (participant.getPaymentStatus() == PaymentStatus.CAPTURED) {
            throw new IllegalStateException("Participant already paid successfully");
        }

        GroupOrder groupOrder = participant.getGroupOrder();

        GroupPayment payment = new GroupPayment();
        payment.setGroupOrder(groupOrder);
        payment.setParticipant(participant);
        payment.setAmount(participant.getAssignedAmount());
        payment.setProvider(PaymentProvider.CPAY);
        payment.setProviderPaymentId(
                "GROUP-CPAY-DEMO-FAILED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
        );
        payment.setStatus(PaymentStatus.FAILED);

        groupPaymentRepository.save(payment);

        participant.setPaymentStatus(PaymentStatus.FAILED);

        participantRepository.save(participant);

        return participant;
    }

    @Override
    public GroupOrderDto toDto(GroupOrder groupOrder) {
        return GroupOrderMappers.toDto(groupOrder);
    }

    @Override
    @Transactional
    public void cancelGroupOrder(String groupCode, String username) {
        GroupOrder groupOrder = getGroupOrder(groupCode);

        if (groupOrder.getStatus() == GroupOrderStatus.FULLY_PAID) {
            throw new IllegalStateException("Cannot cancel a fully paid group order");
        }

        // Refunds are out of scope: forbid cancelling once any money has been captured.
        if (groupOrder.getPaidAmount() != null && groupOrder.getPaidAmount() > 0.0) {
            throw new IllegalStateException("Cannot cancel after a participant has paid");
        }

        if (username != null && !groupOrder.getCreatedBy().getUsername().equals(username)) {
            throw new IllegalStateException("Only the creator can cancel this group order");
        }

        groupOrder.setStatus(GroupOrderStatus.CANCELLED);
        groupOrderRepository.save(groupOrder);

        // Return the items to the creator's cart. The cart is "the user's PENDING
        // order" (findByUserAndStatus(user, PENDING)), so flipping the underlying
        // order back to PENDING makes it reappear as the cart.
        Order order = groupOrder.getOrder();
        if (order != null) {
            order.setStatus(OrderStatus.PENDING);
            order.setCourier(null);
            order.setPlacedAt(null);
            orderRepository.save(order);
        }
    }

    @Override
    @Transactional
    public GroupOrder updateSplitCount(String groupCode, String username, int splitCount) {
        GroupOrder groupOrder = getGroupOrder(groupCode);

        if (username != null && (groupOrder.getCreatedBy() == null ||
                !groupOrder.getCreatedBy().getUsername().equals(username))) {
            throw new IllegalStateException("Only the creator can change the split count");
        }
        if (groupOrder.getStatus() == GroupOrderStatus.CANCELLED ||
                groupOrder.getStatus() == GroupOrderStatus.EXPIRED ||
                groupOrder.getStatus() == GroupOrderStatus.FULLY_PAID) {
            throw new IllegalStateException("Cannot change the split count for this group order");
        }
        if (splitCount < 2) {
            throw new IllegalArgumentException("Split count must be at least 2");
        }
        if (splitCount > maxSplitCount) {
            throw new IllegalArgumentException("Split count exceeds maximum allowed");
        }
        // Money is already captured against the existing split; do not move the goalposts.
        if (participantRepository.existsByGroupOrderIdAndPaymentStatus(groupOrder.getId(), PaymentStatus.CAPTURED)) {
            throw new IllegalStateException("Cannot change the split count after a participant has paid");
        }
        long joined = participantRepository.countByGroupOrderId(groupOrder.getId());
        if (splitCount < joined) {
            throw new IllegalStateException("Split count cannot be lower than the number of joined participants");
        }

        groupOrder.setSplitCount(splitCount);
        groupOrderRepository.save(groupOrder);

        // Re-spread the equal-split shares across the new denominator. ITEMS-split
        // amounts come from item assignments, so they are recomputed in
        // assignItemsToCurrentUser instead.
        if (groupOrder.getSplitType() != GroupSplitType.ITEMS) {
            List<GroupOrderParticipant> participants =
                    participantRepository.findByGroupOrderIdOrderByJoinedAtAsc(groupOrder.getId());
            for (int i = 0; i < participants.size(); i++) {
                GroupOrderParticipant p = participants.get(i);
                p.setAssignedAmount(calculateAssignedAmount(groupOrder, i));
                participantRepository.save(p);
            }
        }

        return getGroupOrder(groupCode);
    }

    @Override
    @Transactional
    public GroupOrder assignItemsToCurrentUser(String groupCode, String username, List<Long> orderItemIds) {
        GroupOrder groupOrder = getGroupOrder(groupCode);

        if (groupOrder.getSplitType() != GroupSplitType.ITEMS) {
            throw new IllegalStateException("Item assignment is only available for ITEMS split orders");
        }
        if (groupOrder.getStatus() == GroupOrderStatus.CANCELLED ||
                groupOrder.getStatus() == GroupOrderStatus.EXPIRED ||
                groupOrder.getStatus() == GroupOrderStatus.FULLY_PAID) {
            throw new IllegalStateException("Cannot assign items for this group order");
        }

        GroupOrderParticipant participant = participantRepository
                .findByGroupOrderIdAndUserUsername(groupOrder.getId(), username)
                .orElseThrow(() -> new IllegalStateException("You are not a participant in this group order"));

        if (participant.getPaymentStatus() == PaymentStatus.CAPTURED) {
            throw new IllegalStateException("Cannot change items after you have paid");
        }

        Order order = groupOrder.getOrder();
        if (order == null || order.getItems() == null) {
            throw new IllegalStateException("Group order has no items to assign");
        }

        // Index the order's line items so we can validate the requested ids and
        // snapshot price/quantity at assignment time.
        java.util.Map<Long, OrderItem> itemsById = new java.util.HashMap<>();
        for (OrderItem item : order.getItems()) {
            itemsById.put(item.getId(), item);
        }

        Set<Long> requestedIds = new LinkedHashSet<>(orderItemIds != null ? orderItemIds : List.of());

        // Reject items that belong to a different participant before changing anything.
        for (Long orderItemId : requestedIds) {
            if (!itemsById.containsKey(orderItemId)) {
                throw new IllegalArgumentException("Order item " + orderItemId + " does not belong to this order");
            }
            Optional<GroupOrderItemAssignment> existing =
                    itemAssignmentRepository.findByGroupOrderIdAndOrderItemId(groupOrder.getId(), orderItemId);
            if (existing.isPresent() && (existing.get().getParticipant() == null ||
                    !existing.get().getParticipant().getId().equals(participant.getId()))) {
                throw new IllegalStateException("Order item " + orderItemId + " is already claimed by another participant");
            }
        }

        // Replace this participant's claims with the requested set.
        itemAssignmentRepository.deleteByParticipant(participant);

        double assignedTotal = 0.0;
        for (Long orderItemId : requestedIds) {
            OrderItem item = itemsById.get(orderItemId);

            GroupOrderItemAssignment assignment = new GroupOrderItemAssignment();
            assignment.setGroupOrder(groupOrder);
            assignment.setParticipant(participant);
            assignment.setOrderItem(item);
            assignment.setProduct(item.getProduct());
            assignment.setItemName(item.getProduct() != null ? item.getProduct().getName() : "Item");
            assignment.setQuantity(item.getQuantity());
            assignment.setUnitPriceSnapshot(item.getUnitPriceSnapshot());
            double lineTotal = round2(item.getLineTotal());
            assignment.setLineTotal(lineTotal);
            itemAssignmentRepository.save(assignment);

            assignedTotal += lineTotal;
        }

        // In an ITEMS split, a participant owes exactly the sum of their claimed lines.
        participant.setAssignedAmount(round2(assignedTotal));
        participantRepository.save(participant);

        return getGroupOrder(groupCode);
    }

    @Override
    @Transactional
    public void leaveGroupOrder(String groupCode, String username) {
        GroupOrder groupOrder = getGroupOrder(groupCode);

        GroupOrderParticipant participant = participantRepository
                .findByGroupOrderIdAndUserUsername(groupOrder.getId(), username)
                .orElseThrow(() -> new IllegalStateException("You are not a participant in this group order"));

        if (groupOrder.getCreatedBy() != null && username != null &&
                groupOrder.getCreatedBy().getUsername().equals(username)) {
            throw new IllegalStateException("The creator cannot leave the group order; cancel it instead");
        }
        if (participant.getPaymentStatus() == PaymentStatus.CAPTURED) {
            throw new IllegalStateException("Cannot leave after you have paid");
        }

        // Release any items this participant had claimed, then remove them.
        itemAssignmentRepository.deleteByParticipant(participant);
        groupOrder.getParticipants().removeIf(p -> p.getId().equals(participant.getId()));
        participantRepository.delete(participant);
    }

    @Override
    public List<GroupOrder> findMyGroups(String username) {
        return groupOrderRepository.findAllForUser(username);
    }

    @Override
    public List<GroupOrder> findMyActiveGroups(String username) {
        Set<GroupOrderStatus> active = EnumSet.of(
                GroupOrderStatus.GROUP_PENDING,
                GroupOrderStatus.WAITING_FOR_PARTICIPANTS,
                GroupOrderStatus.PARTIALLY_PAID
        );
        return groupOrderRepository.findAllForUserAndStatusIn(username, active);
    }

    private void finalizeUnderlyingOrder(GroupOrder groupOrder) {
        String creatorUsername =
                groupOrder.getCreatedBy() != null ? groupOrder.getCreatedBy().getUsername() : null;

        if (creatorUsername == null) {
            throw new IllegalStateException("Group order missing creator");
        }

        Optional<Order> optional = orderService.confirm(creatorUsername);
        Order confirmed = optional.orElse(groupOrder.getOrder());

        try {
            courierAssignmentService.offerOrderToCouriers(confirmed);
        } catch (Exception ignored) {
            // Do not fail payment finalization if courier assignment has a non-critical issue.
        }
    }

    private String generateGroupCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();

        while (true) {
            StringBuilder sb = new StringBuilder();

            for (int i = 0; i < 8; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }

            String code = sb.toString();

            if (groupOrderRepository.findByGroupCode(code).isEmpty()) {
                return code;
            }
        }
    }

    private double calculateAssignedAmount(GroupOrder groupOrder, long participantIndex) {
        long totalCents = Math.round(groupOrder.getTotalAmount() * 100);
        long baseCents = totalCents / groupOrder.getSplitCount();
        long remainderCents = totalCents % groupOrder.getSplitCount();

        long amountCents = baseCents;

        if (participantIndex == groupOrder.getSplitCount() - 1) {
            amountCents += remainderCents;
        }

        return amountCents / 100.0;
    }

    private boolean isExpired(GroupOrder groupOrder) {
        return groupOrder.getExpiresAt() != null &&
                groupOrder.getExpiresAt().isBefore(Instant.now());
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

}
