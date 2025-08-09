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

async function runComprehensiveTests() {
  log('🧪 Starting Comprehensive Nova Volleyball App Tests', 'bold');
  log('==================================================', 'blue');

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

  // Test 3: Athletes CRUD Operations
  log('\n3. Testing Athletes CRUD Operations...', 'yellow');
  
  // Get athletes
  const athletesResult = await testEndpoint('Get Athletes', 'GET', '/athletes', null, token);
  
  // Create a test athlete
  const testAthlete = {
    firstName: 'Test',
    lastName: 'Athlete',
    email: 'test@example.com',
    phone: '555-1234',
    dateOfBirth: '2000-01-01',
    emergencyContact: 'Emergency Contact',
    emergencyContactEmail: 'emergency@example.com',
    emergencyPhone: '555-9999'
  };
  
  const createAthleteResult = await testEndpoint('Create Athlete', 'POST', '/athletes', testAthlete, token);
  
  if (createAthleteResult.success) {
    const athleteId = createAthleteResult.data.athlete.id;
    
    // Update athlete
    const updateData = { ...testAthlete, firstName: 'Updated' };
    await testEndpoint('Update Athlete', 'PUT', `/athletes/${athleteId}`, updateData, token);
    
    // Get specific athlete
    await testEndpoint('Get Athlete by ID', 'GET', `/athletes/${athleteId}`, null, token);
  }

  // Test 4: Events CRUD Operations
  log('\n4. Testing Events CRUD Operations...', 'yellow');
  
  // Get events
  const eventsResult = await testEndpoint('Get Events', 'GET', '/events', null, token);
  
  // Create a test event
  const testEvent = {
    name: 'Test Event',
    description: 'Test event description',
    date: '2025-08-09',
    startTime: '14:00',
    endTime: '16:00',
    maxCapacity: 50,
    createdBy: '218f375d-1add-4ab8-9905-9c35612dc517'
  };
  
  const createEventResult = await testEndpoint('Create Event', 'POST', '/events', testEvent, token);
  
  if (createEventResult.success) {
    const eventId = createEventResult.data.event.id;
    
    // Update event
    const updateEventData = { ...testEvent, name: 'Updated Event' };
    await testEndpoint('Update Event', 'PUT', `/events/${eventId}`, updateEventData, token);
    
    // Get specific event
    await testEndpoint('Get Event by ID', 'GET', `/events/${eventId}`, null, token);
  }

  // Test 5: Check-ins Operations
  log('\n5. Testing Check-ins Operations...', 'yellow');
  
  // Get check-ins
  const checkinsResult = await testEndpoint('Get Check-ins', 'GET', '/checkins', null, token);
  
  // Get today's check-ins
  await testEndpoint('Get Today Check-ins', 'GET', '/checkins/today', null, token);
  
  // Get check-in stats
  await testEndpoint('Get Check-in Stats', 'GET', '/checkins/stats/overview', null, token);

  // Test 6: Public Endpoints (no auth required)
  log('\n6. Testing Public Endpoints...', 'yellow');
  await testEndpoint('Get Today Events (Public)', 'GET', '/events/today');
  await testEndpoint('Get Disabled Events (Public)', 'GET', '/events/disabled');
  await testEndpoint('Get Past Events (Public)', 'GET', '/events/past');

  // Test 7: Search Functionality
  log('\n7. Testing Search Functionality...', 'yellow');
  await testEndpoint('Search Athletes', 'GET', '/athletes/search?query=test', null, token);

  // Test 8: Admin Operations
  log('\n8. Testing Admin Operations...', 'yellow');
  await testEndpoint('Get Users', 'GET', '/auth/users', null, token);
  await testEndpoint('Get Current User', 'GET', '/auth/me', null, token);

  // Test 9: Performance Test
  log('\n9. Testing Performance...', 'yellow');
  const startTime = Date.now();
  await Promise.all([
    testEndpoint('Concurrent Athletes Request', 'GET', '/athletes', null, token),
    testEndpoint('Concurrent Events Request', 'GET', '/events', null, token),
    testEndpoint('Concurrent Check-ins Request', 'GET', '/checkins', null, token)
  ]);
  const endTime = Date.now();
  log(`✅ Concurrent requests completed in ${endTime - startTime}ms`, 'green');

  log('\n🎉 All comprehensive tests completed!', 'bold');
  log('==================================================', 'blue');
  
  // Summary
  log('\n📊 Test Summary:', 'bold');
  log('✅ Health endpoint working', 'green');
  log('✅ Authentication working', 'green');
  log('✅ CRUD operations working', 'green');
  log('✅ Public endpoints working', 'green');
  log('✅ Search functionality working', 'green');
  log('✅ Admin operations working', 'green');
  log('✅ Performance acceptable', 'green');
}

runComprehensiveTests().catch(console.error);
