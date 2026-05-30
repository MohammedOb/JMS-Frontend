const allowedDevOrigins = Array.from(
  new Set(
    (process.env.NEXT_ALLOWED_DEV_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .flatMap((value) => {
        try {
          const url = new URL(value);
          return [value, url.origin, url.hostname];
        } catch {
          return [value];
        }
      })
  )
);

const isVercel = !!process.env.VERCEL;
const isDocker = process.env.DOCKER_BUILD === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins,
  // Docker: use standalone output (minimal production image) with default .next dir.
  // Local dev: keep artifacts in `build/` to reduce Windows file-lock collisions.
  // Vercel: use defaults (Vercel manages output itself).
  ...(isDocker
    ? { output: 'standalone' }
    : isVercel
    ? {}
    : { distDir: 'build' }),
};

module.exports = nextConfig;
