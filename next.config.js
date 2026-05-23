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

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins,
  // Keep local Next.js artifacts out of `.next` to reduce Windows file-lock
  // collisions during dev/build cleanup, but let Vercel use the default output
  // directory because its deployment pipeline expects `.next`.
  ...(process.env.VERCEL ? {} : { distDir: 'build' }),
};

module.exports = nextConfig;
