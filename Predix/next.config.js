/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Suppress dynamic expression warnings from transitive wallet dependencies
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
        'pino-pretty': false,
        lokijs: false,
        encoding: false,
      };
    }

    // Provide Buffer globally and ignore missing optional loggers
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^(pino-pretty|lokijs|encoding)$/,
      })
    );

    return config;
  },
};

module.exports = nextConfig;