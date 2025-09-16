/**
 * Create React App Proxy Configuration for CORS
 * Handles CORS issues during development by proxying API requests
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Development proxy to avoid CORS issues with backend API
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to backend server
  app.use(
    '/api',
    createProxyMiddleware({
      target: import.meta.env.VITE_API_URL || 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add CORS headers to all proxied requests
        proxyReq.setHeader('Origin', import.meta.env.VITE_APP_URL || 'http://localhost:3000');
        proxyReq.setHeader('Access-Control-Request-Method', req.method);
        
        // Log request for debugging
        console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers to all responses
        proxyRes.headers['Access-Control-Allow-Origin'] = import.meta.env.VITE_APP_URL || 'http://localhost:3000';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
        
        // Log response for debugging
        console.log(`[PROXY] ${proxyRes.statusCode} ${req.method} ${req.url}`);
      },
      onError: (err, req, res) => {
        console.error(`[PROXY ERROR] ${req.method} ${req.url}:`, err.message);
      },
    })
  );

  // Proxy WebSocket connections for real-time features
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
      changeOrigin: true,
      ws: true,
      secure: false,
      logLevel: 'debug',
      onProxyReqWs: (proxyReq, req, socket, options, head) => {
        console.log('[WS PROXY] WebSocket connection established');
      },
      onError: (err, req, res) => {
        console.error(`[WS PROXY ERROR] ${req.method} ${req.url}:`, err.message);
      },
    })
  );
};
