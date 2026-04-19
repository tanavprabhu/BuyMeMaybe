import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native ffmpeg/ffprobe binaries must not be bundled into the server chunk graph.
  serverExternalPackages: [
    "fluent-ffmpeg",
    "@ffmpeg-installer/ffmpeg",
    "@ffprobe-installer/ffprobe",
  ],
};

export default nextConfig;
