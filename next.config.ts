import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Turbopack과 충돌하는 소스맵 형식 문제 해결을 위한 eval-source-map 설정
      config.devtool = 'eval-source-map';
    }
    return config;
  }
};

export default nextConfig;
