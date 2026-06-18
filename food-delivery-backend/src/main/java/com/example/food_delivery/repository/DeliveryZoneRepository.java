package com.example.food_delivery.repository;

import com.example.food_delivery.model.domain.DeliveryZone;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, Long> { }
