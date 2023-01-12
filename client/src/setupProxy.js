const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log(app)
  app.use(
    '/socket.io/*',
    createProxyMiddleware({
      target: 'http://localhost:30001',
      // changeOrigin: true,
    })
  );
};