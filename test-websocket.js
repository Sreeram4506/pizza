// Test WebSocket connection and events
const ws = new WebSocket('ws://localhost:5000');

ws.onopen = () => {
  console.log('WebSocket connected');
  ws.send(JSON.stringify({ type: 'test', message: 'Hello from test client' }));
};

ws.onmessage = (event) => {
  console.log('WebSocket message received:', JSON.parse(event.data));
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Test admin action to trigger WebSocket event
console.log('WebSocket test client ready. Add an item in admin to see real-time updates!');
