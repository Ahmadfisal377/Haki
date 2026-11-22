import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep server components dynamic; we query Supabase per request.
  // Individual pages also export `dynamic = "force-dynamic"`.
};

export default nextConfig;
