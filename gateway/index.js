require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// logging
app.use((req, res, next) => {
    console.log("Incoming:", req.method, req.url);
    next();
});

// AUTH (NO body parsing here)
app.use('/auth', createProxyMiddleware({
    target: process.env.AUTH_SERVICE,
    changeOrigin: true,
    pathRewrite: {
        '^/auth': ''
    }
}));

// EVENTS
app.use('/events', createProxyMiddleware({
    target: process.env.EVENT_SERVICE,
    changeOrigin: true,
    pathRewrite: (path, req) => {
        const newPath = '/api/events' + path.replace('/events', '');
        console.log("REWRITE:", path, "→", newPath);
        return newPath;
    }
}));

// ORDERS
app.use('/orders', createProxyMiddleware({
    target: process.env.ORDER_SERVICE,
    changeOrigin: true,
    pathRewrite: {
        '^/orders': ''
    },
    logLevel: 'debug'
}));

app.listen(process.env.PORT, () => {
    console.log(`Gateway running on port ${process.env.PORT}`);
});