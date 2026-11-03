import type { NextConfig } from 'next';
const config: NextConfig = { output: 'export', distDir: process.env.NEXT_BUILD_DIR || '.next', images: { unoptimized: true }, turbopack: { root: process.cwd() } };
export default config;
