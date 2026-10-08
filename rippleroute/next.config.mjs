/** @type {import('next').NextConfig} */
const isDev = process.env.npm_lifecycle_event === "dev" || process.argv.includes("dev");

const nextConfig = {
  distDir: isDev ? ".next_dev" : ".next",
};

export default nextConfig;
