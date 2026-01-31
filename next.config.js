/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Configuración experimental para WebSocket
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Headers para WebSocket
  async headers() {
    return [
      {
        source: '/api/ws',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
