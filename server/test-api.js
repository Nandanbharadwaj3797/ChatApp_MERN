// Simple test script to verify backend API functionality
// Run with: node test-api.js

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  fullName: 'Test User',
  email: 'test@example.com',
  password: 'testpassword123',
  bio: 'This is a test user'
};

let authToken = '';
let userId = '';

async function testAPI() {
  console.log('🧪 Testing Chat App API...\n');

  try {
    // Test 1: Server ping
    console.log('1. Testing server ping...');
    const pingResponse = await axios.get('http://localhost:5000/ping');
    console.log('✅ Server ping successful:', pingResponse.data);
    console.log('');

    // Test 2: User registration
    console.log('2. Testing user registration...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUser);
    console.log('✅ User registration successful:', signupResponse.data.message);
    userId = signupResponse.data.user._id;
    console.log('');

    // Test 3: User login
    console.log('3. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ User login successful:', loginResponse.data.message);
    authToken = loginResponse.data.token;
    console.log('');

    // Test 4: Get users for sidebar
    console.log('4. Testing get users for sidebar...');
    const usersResponse = await axios.get(`${BASE_URL}/messages/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get users successful. Users found:', usersResponse.data.users.length);
    console.log('');

    // Test 5: Send a message
    console.log('5. Testing message sending...');
    const messageResponse = await axios.post(`${BASE_URL}/messages/send/${userId}`, {
      text: 'Hello, this is a test message!'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Message sent successfully:', messageResponse.data.message);
    console.log('');

    // Test 6: Get messages
    console.log('6. Testing get messages...');
    const getMessagesResponse = await axios.get(`${BASE_URL}/messages/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get messages successful. Messages found:', getMessagesResponse.data.messages.length);
    console.log('');

    // Test 7: Update profile
    console.log('7. Testing profile update...');
    const updateResponse = await axios.put(`${BASE_URL}/auth/update-profile`, {
      fullName: 'Updated Test User',
      bio: 'This is an updated bio'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile update successful:', updateResponse.data.message);
    console.log('');

    console.log('🎉 All API tests passed successfully!');
    console.log('');
    console.log('📊 Test Summary:');
    console.log('- Server connectivity: ✅');
    console.log('- User registration: ✅');
    console.log('- User authentication: ✅');
    console.log('- User management: ✅');
    console.log('- Message sending: ✅');
    console.log('- Message retrieval: ✅');
    console.log('- Profile updates: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('');
    console.log('🔍 Troubleshooting tips:');
    console.log('1. Make sure the server is running on port 5000');
    console.log('2. Check that MongoDB is connected');
    console.log('3. Verify environment variables are set correctly');
    console.log('4. Check server console for error messages');
  }
}

// Run the tests
testAPI();
