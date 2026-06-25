import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode: no server-side rendering. React Router prerenders a static
  // index.html shell at build time and hydrates entirely on the client.
  // This keeps Module Federation simple (remotes load client-side only).
  ssr: false,
} satisfies Config;