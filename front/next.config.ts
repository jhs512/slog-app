import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // 코드 실험 iframe 은 출처가 없으므로(null origin) 글꼴·module 스크립트 같은 CORS 요청을 이 경로에만 허용한다.
  async headers() {
    return [
      {
        source: "/code-lab/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
      // 경로에 버전이 들어 있는 C++ 컴파일러 자산(약 29MB)은 다시 받거나 재검증하지 않게 한다.
      {
        source: "/code-lab/jmv/browsercc-0.1.1/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/ken/:id",
        destination: "/p/:id",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
