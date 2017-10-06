package com.ikea.tradfri.lighting.shared.p117a;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public final class C1564a {
    private static final Comparator<C1566c> f4611a = new C15631();
    private final Map<String, C1566c> f4612b = new HashMap();
    private final ArrayList<C1565b> f4613c = new ArrayList();
    private final ArrayList<C1565b> f4614d = new ArrayList();

    static class C15631 implements Comparator<C1566c> {
        C15631() {
        }

        public final /* bridge */ /* synthetic */ int compare(Object obj, Object obj2) {
            return Double.compare(((C1566c) obj).f4623d, ((C1566c) obj2).f4623d);
        }
    }

    public C1564a() {
        // hex, colorX, colorY, hex, sqrt(x^2+y^2)
        this.f4612b.put("dcf0f8", new C1566c(0.3221d, 0.3317d, "dcf0f8", 0.45d));
        this.f4612b.put("eaf6fb", new C1566c(0.3451d, 0.3451d, "eaf6fb", 0.48d));
        this.f4612b.put("f5faf6", new C1566c(0.3804d, 0.3804d, "f5faf6", 0.54d));
        this.f4612b.put("f2eccf", new C1566c(0.4369d, 0.4041d, "f2eccf", 0.59d));
        this.f4612b.put("f1e0b5", new C1566c(0.4599d, 0.4106d, "f1e0b5", 0.61d));
        this.f4612b.put("efd275", new C1566c(0.5056d, 0.4152d, "efd275", 0.66d));
        this.f4612b.put("ebb63e", new C1566c(0.5516d, 0.4075d, "ebb63e", 0.68d));
        this.f4612b.put("e78834", new C1566c(0.58d, 0.38d, "e78834", 0.69d));
        this.f4612b.put("e57345", new C1566c(0.58d, 0.35d, "e57345", 0.67d));
        this.f4612b.put("da5d41", new C1566c(0.62d, 0.34d, "da5d41", 0.7d));
        this.f4612b.put("dc4b31", new C1566c(0.66d, 0.32d, "dc4b31", 0.73d));
        this.f4612b.put("e491af", new C1566c(0.5d, 0.28d, "e491af", 0.57d));
        this.f4612b.put("e8bedd", new C1566c(0.45d, 0.28d, "e8bedd", 0.53d));
        this.f4612b.put("d9337c", new C1566c(0.5d, 0.24d, "d9337c", 0.55d));
        this.f4612b.put("c984bb", new C1566c(0.34d, 0.19d, "c984bb", 0.38d));
        this.f4612b.put("8f2686", new C1566c(0.31d, 0.12d, "8f2686", 0.33d));
        this.f4612b.put("4a418a", new C1566c(0.17d, 0.05d, "4a418a", 0.18d));
        this.f4612b.put("6c83ba", new C1566c(0.2d, 0.1d, "6c83ba", 0.22d));
        this.f4612b.put("a9d62b", new C1566c(0.4099999964237213d, 0.5099999904632568d, "a9d62b", 0.654d));
        this.f4612b.put("d6e44b", new C1566c(0.44999998807907104d, 0.4699999988079071d, "d6e44b", 0.65d));
    }

    private static boolean m5519a(ArrayList<C1565b> arrayList, ArrayList<C1565b> arrayList2) {
        if (arrayList == null || arrayList2 == null || arrayList2.size() != arrayList.size()) {
            return false;
        }
        boolean z = true;
        for (int i = 0; i < arrayList.size(); i++) {
            int i2 = (int) (((C1565b) arrayList.get(i)).f4616b * 1000.0d);
            int i3 = (int) (((C1565b) arrayList2.get(i)).f4616b * 1000.0d);
            if (((int) (((C1565b) arrayList.get(i)).f4615a * 1000.0d)) != ((int) (((C1565b) arrayList2.get(i)).f4615a * 1000.0d)) || i2 != i3) {
                z = false;
            }
        }
        return z;
    }


// predefined colors
    public interface C1334a {
        // RGB hex colors
        public static final String[] f4025a = new String[]{"dcf0f8", "eaf6fb", "f5faf6", "f2eccf", "f1e0b5", "efd275", "ebb63e", "e78834", "e57345", "da5d41", "dc4b31", "e491af", "e8bedd", "d9337c", "c984bb", "8f2686", "4a418a", "6c83ba", "a9d62b", "d6e44b"};
        // hues: => gets normalized to 0..65279 => 0..360
        public static final int[] f4026b = new int[]{2681, 5989, 5800, 5129, 5427, 5309, 4980, 4137, 1662, 1490, 0, 62148, 62007, 59789, 55784, 53953, 47822, 47324, 11383, 8572};
        // saturations: => gets normalized to 0..65279 => 0..1
        public static final int[] f4027c = new int[]{4360, 12964, 24394, 40781, 42596, 52400, 62974, 65279, 53420, 61206, 65279, 49198, 41158, 65279, 44554, 65279, 65279, 51774, 65279, 55985};
        // => interpreted as HSV color with V=1

        // cold/warm white: hex => color temperatures (+/- 10)
        {
            "f5faf6": [250, /* alternative: */ 182, 143],
            "f1e0b5": [370], // DEFAULT FOR ALL NON-MATCHED colors
            "efd275": [454]
        }
    }

