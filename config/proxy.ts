export default {
  dev: {
    '/auth/': {
      target: 'http://localhost:9999',
      changeOrigin: true,
    },
    '/admin/': {
      target: 'http://localhost:9999',
      changeOrigin: true,
    },
    '/product/': {
      target: 'http://localhost:9999',
      changeOrigin: true,
    },
    '/file/': {
      target: 'http://localhost:9999',
      changeOrigin: true,
    },
  },
};
