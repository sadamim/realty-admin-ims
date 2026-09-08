/** @type {import('next').NextConfig} */
const nextConfig = {
  // The mongodb driver must stay a real Node module on the server.
  serverExternalPackages: ["mongodb", "bcryptjs"],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "realtyfocus.info", pathname: "/**" },
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
