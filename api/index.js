const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Nova Volleyball Check-in API is running!'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working correctly',
    endpoints: [
      '/api/health',
      '/api/test',
      '/api/auth/login',
      '/api/athletes',
      '/api/events',
      '/api/checkins'
    ]
  });
});

// Auth endpoint (simplified for now)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // For now, accept any login for testing
  res.json({
    token: 'test-token-' + Date.now(),
    user: {
      id: '1',
      username: username,
      email: username + '@nova.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    }
  });
});

// Athletes endpoint (simplified)
app.get('/api/athletes', (req, res) => {
  res.json({ 
    athletes: [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        dateOfBirth: '2000-01-01',
        emergencyContact: 'Jane Doe',
        emergencyContactEmail: 'jane@example.com',
        emergencyPhone: '555-5678',
        hasValidWaiver: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  });
});

// Events endpoint (simplified)
app.get('/api/events', (req, res) => {
  res.json({ 
    events: [
      {
        id: '1',
        name: 'Practice Session',
        description: 'Regular volleyball practice',
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '20:00',
        maxCapacity: 20,
        currentCapacity: 0,
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  });
});

// Check-ins endpoint (simplified)
app.get('/api/checkins', (req, res) => {
  res.json({ 
    checkins: [
      {
        id: '1',
        athleteId: '1',
        eventId: '1',
        checkInTime: new Date().toISOString(),
        waiverValidated: true,
        notes: 'Test check-in',
        createdAt: new Date().toISOString(),
        firstName: 'John',
        lastName: 'Doe',
        eventName: 'Practice Session'
      }
    ]
  });
});

// Stats endpoint (simplified)
app.get('/api/checkins/stats/overview', (req, res) => {
  res.json({
    stats: {
      today: 1,
      total: 1,
      waiverValidated: 1,
      waiverNotValidated: 0
    }
  });
});

// Additional endpoints for the app
app.get('/api/events/today', (req, res) => {
  res.json({ 
    events: [
      {
        id: '1',
        name: 'Practice Session',
        description: 'Regular volleyball practice',
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '20:00',
        maxCapacity: 20,
        currentCapacity: 0,
        isActive: true
      }
    ]
  });
});

app.get('/api/events/past', (req, res) => {
  res.json({ events: [] });
});

app.get('/api/checkins/today', (req, res) => {
  res.json({ 
    checkins: [
      {
        id: '1',
        athleteId: '1',
        eventId: '1',
        checkInTime: new Date().toISOString(),
        waiverValidated: true,
        notes: 'Test check-in',
        createdAt: new Date().toISOString(),
        firstName: 'John',
        lastName: 'Doe',
        eventName: 'Practice Session'
      }
    ]
  });
});

module.exports = app;
