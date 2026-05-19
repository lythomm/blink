import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["e0aa-212-194-150-114.ngrok-free.app"],
  images: {
    loader: "custom",
    loaderFile: "./app/lib/cloudinary-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
