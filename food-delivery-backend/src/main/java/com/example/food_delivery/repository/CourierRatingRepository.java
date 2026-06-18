package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.Courier;
import com.example.food_delivery.model.domain.CourierRating;
import com.example.food_delivery.model.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourierRatingRepository extends JpaRepository<CourierRating, Long> {

    List<CourierRating> findByCourier(Courier courier);

    Optional<CourierRating> findByCourierAndCustomerAndOrderId(Courier courier, User customer, Long orderId);

    /** Returns couriers that the given customer has rated LOW (avg or specific ratings) */
    @Query("SELECT DISTINCT cr.courier FROM CourierRating cr " +
           "WHERE cr.customer.username = :customerUsername " +
           "AND cr.rating <= :threshold")
    List<Courier> findCouriersRatedLowByCustomer(
            @Param("customerUsername") String customerUsername,
            @Param("threshold") int threshold);

    @Query("SELECT AVG(cr.rating) FROM CourierRating cr WHERE cr.courier = :courier")
    Double findAverageRatingByCourier(@Param("courier") Courier courier);
}
