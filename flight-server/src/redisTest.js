// redisTest.js
const { createClient } = require('redis');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const client = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

client.on('error', (err) => {
    console.error('Redis error:', err);
});

async function testRedisConnection() {
    try {
        await client.connect();
        console.log('Connected to Redis');
        
        // Test a simple command
        await client.set('test-key', 'Hello Redis');
        const value = await client.get('test-key');
        console.log('Value from Redis:', value);

        await client.disconnect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
}

testRedisConnection();
