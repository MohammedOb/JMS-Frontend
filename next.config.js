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
};

module.exports = nextConfig;
