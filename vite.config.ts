// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    // Overridable for the offline Android bundle:
    // `NITRO_PRESET=node-server npm run build` emits a runnable local server.
    preset: process.env.NITRO_PRESET ?? "vercel",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Opt-in static prerender (`PRERENDER=1`) for the Capacitor bundle.
    // Left OFF by default: the in-build prerenderer 500s on "/" in this
    // repo snapshot while the same server answers 200 at runtime, so
    // enabling it unconditionally would break production builds.
    // The android export snapshots the running server instead (see scripts/).
    ...(process.env.PRERENDER === "1"
      ? {
          prerender: { enabled: true },
          pages: [{ path: "/", prerender: { enabled: true } }],
        }
      : {}),
  },
});
