#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

// Test colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    log(`✅ ${name}: SUCCESS`, 'green');
    return { success: true, data: response.data };
  } catch (error) {
    log(`❌ ${name}: FAILED - ${error.response?.data?.error || error.message}`, 'red');
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runTests() {
  log('🧪 Starting Nova Volleyball Check-in App Tests', 'bold');
  log('==============================================', 'blue');

  // Test 1: Health Check
  log('\n1. Testing Health Endpoint...', 'yellow');
  await testEndpoint('Health Check', 'GET', '/health');

  // Test 2: Authentication
  log('\n2. Testing Authentication...', 'yellow');
  const authResult = await testEndpoint('Login', 'POST', '/auth/login', {
    username: 'calebhobbs',
    password: '@zCardinals16'
  });

  if (!authResult.success) {
    log('❌ Authentication failed, stopping tests', 'red');
    return;
  }

  const token = authResult.data.token;
  log(`✅ Token received: ${token.substring(0, 20)}...`, 'green');

  // Test 3: Get Athletes
  log('\n3. Testing Athletes Endpoint...', 'yellow');
  const athletesResult = await testEndpoint('Get Athletes', 'GET', '/athletes', null, token);
  
  if (athletesResult.success && athletesResult.data.athletes.length > 0) {
    log(`✅ Found ${athletesResult.data.athletes.length} athletes`, 'green');
  }

  // Test 4: Get Events
  log('\n4. Testing Events Endpoint...', 'yellow');
  const eventsResult = await testEndpoint('Get Events', 'GET', '/events', null, token);
  
  if (eventsResult.success && eventsResult.data.events.length > 0) {
    log(`✅ Found ${eventsResult.data.events.length} events`, 'green');
  }

  // Test 5: Get Check-ins
  log('\n5. Testing Check-ins Endpoint...', 'yellow');
  const checkinsResult = await testEndpoint('Get Check-ins', 'GET', '/checkins', null, token);
  
  if (checkinsResult.success) {
    log(`✅ Found ${checkinsResult.data.checkins.length} check-ins`, 'green');
  }

  // Test 6: Get Stats
  log('\n6. Testing Stats Endpoint...', 'yellow');
  await testEndpoint('Get Stats', 'GET', '/checkins/stats/overview', null, token);

  // Test 7: Public Check-in Page (no auth required)
  log('\n7. Testing Public Check-in Endpoints...', 'yellow');
  await testEndpoint('Get Today Events (Public)', 'GET', '/events/today');
  await testEndpoint('Get Disabled Events (Public)', 'GET', '/events/disabled');
  await testEndpoint('Get Past Events (Public)', 'GET', '/events/past');

  log('\n🎉 All tests completed!', 'bold');
  log('==============================================', 'blue');
}

runTests().catch(console.error);
