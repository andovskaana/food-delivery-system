package com.example.food_delivery.web.controllers;

import com.example.food_delivery.dto.domain.*;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.service.application.GroupOrderApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "group-order-controller")
@RestController
@RequestMapping("/api/group-orders")
public class GroupOrderController {
    private final GroupOrderApplicationService groupOrderApplicationService;

    public GroupOrderController(GroupOrderApplicationService groupOrderApplicationService) {
        this.groupOrderApplicationService = groupOrderApplicationService;
    }

    @Operation(summary = "Create a new group order from the current pending cart")
    @PostMapping
    public ResponseEntity<GroupOrderDto> createGroupOrder(@RequestBody CreateGroupOrderRequestDto request,
                                                          @AuthenticationPrincipal User user) {
        String username = user != null ? user.getUsername() : null;
        if (username == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(groupOrderApplicationService.createGroupOrder(request, username));
    }

    @Operation(summary = "Groups created by or joined by the current user")
    @GetMapping("/my")
    public ResponseEntity<List<GroupOrderDto>> getMyGroups(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(groupOrderApplicationService.getMyGroups(user.getUsername()));
    }

    @Operation(summary = "Active groups created by or joined by the current user")
    @GetMapping("/my-active")
    public ResponseEntity<List<GroupOrderDto>> getMyActiveGroups(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(groupOrderApplicationService.getMyActiveGroups(user.getUsername()));
    }

    @Operation(summary = "View a group order by invite code")
    @GetMapping("/{code}")
    public ResponseEntity<GroupOrderDto> getGroupOrder(@PathVariable String code,
                                                       @AuthenticationPrincipal User user) {
        String username = user != null ? user.getUsername() : null;
        return ResponseEntity.ok(groupOrderApplicationService.getGroupOrder(code, username));
    }

    @Operation(summary = "Join a group order")
    @PostMapping("/{code}/join")
    public ResponseEntity<GroupOrderParticipantDto> joinGroupOrder(@PathVariable String code,
                                                                   @RequestBody(required = false) JoinGroupOrderRequestDto request,
                                                                   @AuthenticationPrincipal User user) {
        String username = user != null ? user.getUsername() : null;
        return ResponseEntity.ok(groupOrderApplicationService.joinGroupOrder(code, request, username));
    }

    @Operation(summary = "Edit participant slot count before anyone pays")
    @PutMapping("/{code}/split-count")
    public ResponseEntity<GroupOrderDto> updateSplitCount(@PathVariable String code,
                                                          @RequestBody UpdateGroupSplitCountRequestDto request,
                                                          @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(groupOrderApplicationService.updateSplitCount(code, request, user.getUsername()));
    }

    @Operation(summary = "Assign split-by-items choices to the current participant")
    @PutMapping("/{code}/items")
    public ResponseEntity<GroupOrderDto> assignItems(@PathVariable String code,
                                                     @RequestBody(required = false) AssignGroupItemsRequestDto request,
                                                     @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(groupOrderApplicationService.assignItems(code, request, user.getUsername()));
    }

    @Operation(summary = "Leave a group order as the current logged in participant")
    @PostMapping("/{code}/leave")
    public ResponseEntity<Void> leaveGroupOrder(@PathVariable String code,
                                                @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        groupOrderApplicationService.leaveGroupOrder(code, user.getUsername());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Get participant payment details by payment token")
    @GetMapping("/participant/{paymentToken}")
    public ResponseEntity<GroupOrderParticipantDto> getParticipant(@PathVariable String paymentToken,
                                                                   @AuthenticationPrincipal User user) {
        String username = user != null ? user.getUsername() : null;
        return ResponseEntity.ok(groupOrderApplicationService.getParticipant(paymentToken, username));
    }

    @Operation(summary = "Participant pays their share")
    @PostMapping("/participant/{paymentToken}/pay")
    public ResponseEntity<GroupOrderParticipantDto> payParticipant(
            @PathVariable String paymentToken,
            @RequestParam(defaultValue = "true") boolean success,
            @AuthenticationPrincipal User user) {
        String username = user != null ? user.getUsername() : null;
        if (success) {
            return ResponseEntity.ok(groupOrderApplicationService.payParticipant(paymentToken, username));
        }
        return ResponseEntity.ok(groupOrderApplicationService.failParticipantPayment(paymentToken, username));
    }

    @Operation(summary = "Get group order payment progress/status")
    @GetMapping("/{code}/status")
    public ResponseEntity<GroupOrderDto> getStatus(@PathVariable String code,
                                                   @AuthenticationPrincipal User user) {
        String username = user != null ? user.getUsername() : null;
        return ResponseEntity.ok(groupOrderApplicationService.getStatus(code, username));
    }

    @Operation(summary = "Cancel a group order")
    @PostMapping("/{code}/cancel")
    public ResponseEntity<Void> cancelGroupOrder(@PathVariable String code,
                                                 @AuthenticationPrincipal User user) {
        String username = user != null ? user.getUsername() : null;
        if (username == null) {
            return ResponseEntity.status(401).build();
        }
        groupOrderApplicationService.cancelGroupOrder(code, username);
        return ResponseEntity.ok().build();
    }
}
