import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aadupuli.aatam",
  appName: "Aadu Puli Aatam",
  webDir: "android-www",
  backgroundColor: "#0c0a09",
  android: {
    allowMixedContent: false,
  },
  server: {
    // Served locally on-device: full offline bundle. No remote URL.
    androidScheme: "https",
  },
};

export default config;
