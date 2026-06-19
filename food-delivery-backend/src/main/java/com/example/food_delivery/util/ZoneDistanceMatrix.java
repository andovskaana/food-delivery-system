package com.example.food_delivery.util;

import com.example.food_delivery.model.enums.SkopjeZone;

import java.util.Map;

/**
 * Hardcoded estimated travel time (in minutes) between Skopje zones.
 * This is a simplified, fictional proxy for real GPS-based distance —
 * used because the project has no real-time courier location tracking.
 *
 * Same zone = 3 min (intra-zone travel).
 * Adjacent zones = 8-12 min.
 * Distant zones = 15-20 min.
 *
 * Values are symmetric (A→B == B→A) and approximate real Skopje geography:
 * Centar is the hub; Karposh and Kisela Voda are close to Centar;
 * Aerodrom, Gazi Baba, and Butel are further out.
 */
public final class ZoneDistanceMatrix {

    private static final Map<String, Integer> DISTANCES = Map.ofEntries(
            // Centar
            Map.entry(key(SkopjeZone.CENTAR, SkopjeZone.CENTAR), 3),
            Map.entry(key(SkopjeZone.CENTAR, SkopjeZone.KARPOSH), 8),
            Map.entry(key(SkopjeZone.CENTAR, SkopjeZone.AERODROM), 12),
            Map.entry(key(SkopjeZone.CENTAR, SkopjeZone.KISELA_VODA), 9),
            Map.entry(key(SkopjeZone.CENTAR, SkopjeZone.GAZI_BABA), 11),
            Map.entry(key(SkopjeZone.CENTAR, SkopjeZone.BUTEL), 13),

            // Karposh
            Map.entry(key(SkopjeZone.KARPOSH, SkopjeZone.KARPOSH), 3),
            Map.entry(key(SkopjeZone.KARPOSH, SkopjeZone.AERODROM), 18),
            Map.entry(key(SkopjeZone.KARPOSH, SkopjeZone.KISELA_VODA), 14),
            Map.entry(key(SkopjeZone.KARPOSH, SkopjeZone.GAZI_BABA), 17),
            Map.entry(key(SkopjeZone.KARPOSH, SkopjeZone.BUTEL), 16),

            // Aerodrom
            Map.entry(key(SkopjeZone.AERODROM, SkopjeZone.AERODROM), 3),
            Map.entry(key(SkopjeZone.AERODROM, SkopjeZone.KISELA_VODA), 10),
            Map.entry(key(SkopjeZone.AERODROM, SkopjeZone.GAZI_BABA), 15),
            Map.entry(key(SkopjeZone.AERODROM, SkopjeZone.BUTEL), 19),

            // Kisela Voda
            Map.entry(key(SkopjeZone.KISELA_VODA, SkopjeZone.KISELA_VODA), 3),
            Map.entry(key(SkopjeZone.KISELA_VODA, SkopjeZone.GAZI_BABA), 13),
            Map.entry(key(SkopjeZone.KISELA_VODA, SkopjeZone.BUTEL), 17),

            // Gazi Baba
            Map.entry(key(SkopjeZone.GAZI_BABA, SkopjeZone.GAZI_BABA), 3),
            Map.entry(key(SkopjeZone.GAZI_BABA, SkopjeZone.BUTEL), 9),

            // Butel
            Map.entry(key(SkopjeZone.BUTEL, SkopjeZone.BUTEL), 3)
    );

    private ZoneDistanceMatrix() {}

    /** Returns the estimated minutes between two zones. Symmetric — order doesn't matter. */
    public static int minutesBetween(SkopjeZone a, SkopjeZone b) {
        if (a == null || b == null) return 15; // unknown — neutral/worst-case middle estimate
        Integer direct = DISTANCES.get(key(a, b));
        if (direct != null) return direct;
        Integer reverse = DISTANCES.get(key(b, a));
        if (reverse != null) return reverse;
        return 15;
    }

    private static String key(SkopjeZone a, SkopjeZone b) {
        return a.name() + "_" + b.name();
    }
}
