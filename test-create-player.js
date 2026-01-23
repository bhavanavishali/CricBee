// Test script for the create player endpoint
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testCreatePlayer() {
  try {
    // First, we need to login as a club manager to get auth token
    console.log('Testing login as club manager...');
    
    // Login credentials (you'll need to replace with actual club manager credentials)
    const loginData = {
      email_or_phone: 'club@example.com', // Replace with actual club manager email
      password: 'password123' // Replace with actual password
    };
    
    // Try to login
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
      console.log('Login successful:', loginResponse.data);
      
      // Now test the create player endpoint
      const token = loginResponse.data.access_token;
      const playerData = {
        full_name: 'Test Player',
        email: 'testplayer@example.com',
        phone: '1234567890',
        age: 25,
        address: '123 Test Street, Test City'
      };
      
      console.log('Testing create player endpoint...');
      const createPlayerResponse = await axios.post(
        `${API_BASE_URL}/club-profile/club/1/create-player`, // Assuming club ID is 1
        playerData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Create player successful:', createPlayerResponse.data);
      
    } catch (loginError) {
      console.log('Login failed. This is expected if no club manager exists yet.');
      console.log('Error:', loginError.response?.data || loginError.message);
      
      // Test the endpoint without auth to see if we get the expected auth error
      console.log('\nTesting create player endpoint without auth...');
      try {
        const playerData = {
          full_name: 'Test Player',
          email: 'testplayer@example.com',
          phone: '1234567890',
          age: 25,
          address: '123 Test Street, Test City'
        };
        
        const response = await axios.post(
          `${API_BASE_URL}/club-profile/club/1/create-player`,
          playerData
        );
        console.log('Unexpected success:', response.data);
      } catch (authError) {
        console.log('Expected auth error:', authError.response?.data || authError.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testCreatePlayer();
