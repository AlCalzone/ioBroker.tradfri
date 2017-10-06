package com.ikea.tradfri.lighting.shared.p076e;

import android.text.TextUtils;
import com.ikea.tradfri.lighting.ipso.Device;
import com.ikea.tradfri.lighting.ipso.HSAccessory;
import com.ikea.tradfri.lighting.ipso.IPSOObjects;
import com.ikea.tradfri.lighting.ipso.Light;
import java.util.ArrayList;
import java.util.Iterator;

public final class C1617c {

    static class C16081 extends ArrayList<String> {
        public C16081() {
            add("TRADFRI bulb GU10 WS 400lm");
        }
    }

    static class C16092 extends ArrayList<String> {
        public C16092() {
            add("TRADFRI motion sensor");
        }
    }

    static class C16103 extends ArrayList<String> {
        public C16103() {
            add("TRADFRI wireless dimmer");
        }
    }

    static class C16114 extends ArrayList<String> {
        public C16114() {
            add("TRADFRI plug");
        }
    }

    static class C16125 extends ArrayList<String> {
        public C16125() {
            add("TRADFRI bulb E27 C/WS opal 600lm");
            add("TRADFRI bulb E14 C/WS opal 600lm");
        }
    }

    static class C16136 extends ArrayList<String> {
        public C16136() {
            add("TRADFRI bulb GU10 W 400lm");
        }
    }

    static class C16147 extends ArrayList<String> {
        public C16147() {
            add("TRADFRI bulb E27 WS clear 950lm");
            add("TRADFRI bulb E27 WS opal 950lm");
            add("TRADFRI bulb E14 WS opal 400lm");
            add("TRADFRI bulb E12 WS opal 400lm");
            add("TRADFRI bulb E26 WS clear 950lm");
            add("TRADFRI bulb E26 WS opal 980lm");
            add("TRADFRI bulb E27 WS opal 980lm");
        }
    }

    static class C16158 extends ArrayList<String> {
        public C16158() {
            add("TRADFRI bulb E26 opal 1000lm");
            add("TRADFRI bulb E27 opal 1000lm");
            add("TRADFRI bulb E26 W opal 1000lm");
            add("TRADFRI bulb E27 W opal 1000lm");
            add("TRADFRI bulb E14 W op/ch 400lm");
            add("TRADFRI bulb E12 W op/ch 400lm");
        }
    }

    static class C16169 extends ArrayList<String> {
        public C16169() {
            add("TRADFRI bulb E27 C/WS opal 600lm");
            add("TRADFRI bulb E14 C/WS opal 600lm");
            add("TRADFRI bulb E27 C/WS opal 600");
            add("TRADFRI bulb E27 CWS opal 600");
            add("TRADFRI bulb E26 CWS opal 600");
            add("TRADFRI bulb E14 CWS opal 600");
            add("TRADFRI bulb E12 CWS opal 600");
        }
    }

    public static String m5933a(HSAccessory hSAccessory) {
        if (hSAccessory == null) {
            return "12";
        }
        Device device = hSAccessory.getDevice();
        if (device == null || device.getModelNumber() == null) {
            return C1617c.m5943k(hSAccessory);
        }
        String modelNumber = device.getModelNumber();
        return modelNumber.equalsIgnoreCase("TRADFRI bulb GU10 WS 400lm") ? "9" : 
        modelNumber.equalsIgnoreCase("TRADFRI bulb GU10 W 400lm") ? "13" : 
        (modelNumber.equalsIgnoreCase("TRADFRI bulb E27 WS clear 950lm") ||
            modelNumber.equalsIgnoreCase("TRADFRI bulb E27 WS opal 950lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E14 WS opal 400lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E12 WS opal 400lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E26 WS clear 950lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E26 WS opal 980lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E27 WS opal 980lm")) ? "1" : 
        (modelNumber.equalsIgnoreCase("TRADFRI bulb E27 C/WS opal 600lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E14 C/WS opal 600lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E27 C/WS opal 600") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E27 CWS opal 600") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E26 CWS opal 600") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E14 CWS opal 600") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E12 CWS opal 600")) ? "0" : 
        (modelNumber.equalsIgnoreCase("TRADFRI bulb E26 opal 1000lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E27 opal 1000lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E26 W opal 1000lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E27 W opal 1000lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E14 W op/ch 400lm") || 
            modelNumber.equalsIgnoreCase("TRADFRI bulb E12 W op/ch 400lm")) ? "2" : 
        (modelNumber.equalsIgnoreCase("FLOALT panel WS 30x30") || 
            modelNumber.equalsIgnoreCase("FLOALT panel WS 30x90") || 
            modelNumber.equalsIgnoreCase("FLOALT panel WS 60x60")) ? "3" : 
        modelNumber.equalsIgnoreCase("FLOALT panel C/WS 30x30") ? "4" : 
        (modelNumber.equalsIgnoreCase("SURTE door WS 38x64") ||
            modelNumber.equalsIgnoreCase("JORMLIEN door WS 40x80")) ? "5" : 
        modelNumber.equalsIgnoreCase("TRADFRI remote control") ? "6" : 
        modelNumber.equalsIgnoreCase("TRADFRI motion sensor") ? "7" : 
        modelNumber.equalsIgnoreCase("TRADFRI wireless dimmer") ? "8" : 
        modelNumber.equalsIgnoreCase("TRADFRI plug") ? "500" : 
        C1617c.m5943k(hSAccessory);
    }

    public static boolean m5934b(HSAccessory hSAccessory) {
        String a = C1617c.m5933a(hSAccessory);
        return a.equalsIgnoreCase("1") || 
        a.equalsIgnoreCase("2") || 
        a.equalsIgnoreCase("0") ||
         a.equalsIgnoreCase("5") || 
         a.equalsIgnoreCase("3") || 
         a.equalsIgnoreCase("4") || 
         a.equalsIgnoreCase("9") || 
         a.equalsIgnoreCase("14") || 
         a.equalsIgnoreCase("15") || 
         a.equalsIgnoreCase("13");
    }

    public static boolean m5935c(HSAccessory hSAccessory) {
        String a = C1617c.m5933a(hSAccessory);
        return a.equals("6") || 
        a.equals("8") || 
        a.equals("7") || 
        a.equalsIgnoreCase("16") || 
        a.equalsIgnoreCase("17");
    }

    public static boolean m5936d(HSAccessory hSAccessory) {
        String a = C1617c.m5933a(hSAccessory);
        return a.equalsIgnoreCase("1") || 
        a.equalsIgnoreCase("2") || 
        a.equalsIgnoreCase("0") || 
        a.equalsIgnoreCase("5") || 
        a.equalsIgnoreCase("3") || 
        a.equalsIgnoreCase("4") || 
        a.equalsIgnoreCase("9") || 
        a.equalsIgnoreCase("13") || 
        a.equals("14");
    }

    public static boolean m5937e(HSAccessory hSAccessory) {
        String a = C1617c.m5933a(hSAccessory);
        return a.equalsIgnoreCase("15") || 
        a.equalsIgnoreCase("2") || 
        a.equalsIgnoreCase("13");
    }

    public static boolean m5938f(HSAccessory hSAccessory) {
        String a = C1617c.m5933a(hSAccessory);
        return a.equals("6") || 
        a.equals("16");
    }

    public static boolean m5939g(HSAccessory hSAccessory) {
        return C1617c.m5933a(hSAccessory).equals("8");
    }

    public static boolean m5940h(HSAccessory hSAccessory) {
        String a = C1617c.m5933a(hSAccessory);
        return a.equals("7") || 
        a.equals("17");
    }

    public static boolean m5941i(HSAccessory hSAccessory) {
        String a = C1617c.m5933a(hSAccessory);
        return a.equalsIgnoreCase("1") ||
 
        a.equalsIgnoreCase("3") ||
        a.equalsIgnoreCase("5") ||
        a.equalsIgnoreCase("9");
    }

    public static boolean m5942j(HSAccessory hSAccessory) {
        String a = C1617c.m5933a(hSAccessory);
        return a.equalsIgnoreCase("0") ||
        a.equalsIgnoreCase("4") ||
        a.equalsIgnoreCase("14");
    }

    // a group of some sort
    private static String m5943k(HSAccessory hSAccessory) {
        if (hSAccessory.getLightList() == null || hSAccessory.getLightList().size() == 0) {
            // no lights
            if ((hSAccessory.getSwitchList() == null || hSAccessory.getSwitchList().size() == 0) ) {
                // no switches
                if (hSAccessory.getSensorList() == null || hSAccessory.getSensorList().size() == 0) {
                    // no sensors => empty accessory
                    return "12"
                } else {
                    // sensor (motion?)
                    return  "17"
                }
            }
            // switches of some sort
            return "16"
        } else {
            // empty? => 12
            // has getOriginalColor() => 15 // ??
            // else: => 14
        }
    }
}


if (a.equalsIgnoreCase("6")) {
    // remote_control)});
} else if (a.equalsIgnoreCase("7")) {
    // motion_sensor)});
} else if (a.equalsIgnoreCase("8")) {
    // wireless_dimmer)});
} else if (a.equalsIgnoreCase("0") || 
    a.equalsIgnoreCase("1") || 
    a.equalsIgnoreCase("2")) {
    // bulb
} else if (a.equalsIgnoreCase("9") || 
    a.equalsIgnoreCase("13")) {
    // bulb gu10
} else if (a.equalsIgnoreCase("3") || 
    a.equalsIgnoreCase("4")) {
    // panel
} else if (a.equalsIgnoreCase("5")) {
    // door
} else if (d.getDevice() == null || TextUtils.isEmpty(d.getDevice().getModelNumber())) {
    // unknown_device
} else {
    a = String.format(/*...*/, new Object[]{d.getDevice().getModelNumber()});
    i = 0;
}
