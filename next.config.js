// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  trailingSlash: true,
  exportPathMap: function () {
    return {
      '/': { page: '/' },
    };
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
  webpack: (config, { dev, isServer }) => {
    // Generate Dynamic Sitemap
    if (isServer) {
      require('./scripts/generate-sitemap');
    }
    // Replace React with Preact only in client production build
    if (!dev && !isServer) {
      Object.assign(config.resolve.alias, {
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
      });
    }

    return config;
  },
});
