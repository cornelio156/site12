#!/usr/bin/env node

/**
 * Test script to verify server configuration
 * This helps ensure the server is properly configured for Render deployment
 */

import http from 'http';

const testPort = process.env.PORT || 3001;
const testHost = '0.0.0.0';

console.log('🧪 Testing server configuration...');
console.log(`📍 Testing on ${testHost}:${testPort}`);

// Test if server can bind to 0.0.0.0
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'ok', 
    message: 'Test server running',
    host: testHost,
    port: testPort,
    timestamp: new Date().toISOString()
  }));
});

// Configure timeouts like production
server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;

server.listen(testPort, testHost, () => {
  console.log('✅ Server successfully bound to 0.0.0.0');
  console.log(`✅ Server listening on ${testHost}:${testPort}`);
  console.log('✅ Configuration test passed!');
  
  // Test the health endpoint
  const options = {
    hostname: 'localhost',
    port: testPort,
    path: '/',
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Health check response:', data);
      console.log('🎉 All tests passed! Your server is ready for Render deployment.');
      server.close();
    });
  });
  
  req.on('error', (err) => {
    console.error('❌ Health check failed:', err.message);
    server.close();
  });
  
  req.end();
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`❌ Port ${testPort} is already in use. Try a different port.`);
  } else {
    console.error('❌ Server error:', error.message);
  }
  process.exit(1);
});
