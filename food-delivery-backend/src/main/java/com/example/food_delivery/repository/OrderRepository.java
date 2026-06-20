package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.Order;
import com.example.food_delivery.model.domain.Restaurant;
import com.example.food_delivery.model.domain.User;
import com.example.food_delivery.model.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByUserAndStatus(User user, OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.status = 'CONFIRMED' ORDER BY o.placedAt ASC")
    List<Order> findConfirmed();

    @Query("SELECT o FROM Order o WHERE o.status = 'CONFIRMED' AND o.courier IS NULL ORDER BY o.placedAt ASC")
    List<Order> findConfirmedUnassignedOrders();

    @Query("SELECT o FROM Order o WHERE o.courier.user.username = :courierUsername")
    List<Order> findByCourierUsername(@Param("courierUsername") String courierUsername);

    @Query("SELECT o FROM Order o WHERE o.courier.user.username = :courierUsername AND o.status = 'DELIVERED'")
    List<Order> findByCourierUsernameAndDelivered(@Param("courierUsername") String courierUsername);

    @Query("SELECT o FROM Order o WHERE o.user.username = :username AND (o.status = 'CONFIRMED' OR o.status = 'PICKED_UP' OR o.status = 'EN_ROUTE' OR o.status = 'IN_PREPARATION' OR o.status = 'READY_FOR_PICKUP' OR o.status = 'ACCEPTED_BY_RESTAURANT') ORDER BY o.placedAt DESC")
    List<Order> findByUsernameAndActive(@Param("username") String username);

    @Query("SELECT o FROM Order o WHERE o.user.username = :username AND o.status = 'DELIVERED' ORDER BY o.deliveredAt DESC")
    List<Order> findDeliveredByCustomerUsername(@Param("username") String username);

    /** For owner analytics — avoids loading ALL orders */
    @Query("SELECT o FROM Order o WHERE o.restaurant.id = :restaurantId ORDER BY o.placedAt DESC")
    List<Order> findByRestaurantId(@Param("restaurantId") Long restaurantId);

    List<Order> findByRestaurant(Restaurant restaurant);
}
