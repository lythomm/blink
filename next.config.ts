import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["72f7-212-194-150-114.ngrok-free.app"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
