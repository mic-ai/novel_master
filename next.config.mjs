import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NEXT_DIST_DIR env var allows redirecting build output to native Linux filesystem
  // in Windows/WSL environments where NTFS rmdir can return EIO.
  // Vercel builds leave this unset and use the default '.next'.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),

  // Enable Next.js instrumentation hook for Sentry server-side initialization
  experimental: { instrumentationHook: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  webpack(config, { isServer }) {
    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings ?? []),
        { module: /node_modules\/require-in-the-middle/ },
      ];
    }
    return config;
  },
};

// Wrap with Sentry only when DSN is configured (skipped in dev without SENTRY_DSN)
const sentryConfig = {
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent:  !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;
