const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// File path for persistent user storage
const usersFilePath = '/tmp/users.json';

// Function to load users from file
function loadUsers() {
  try {
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  
  // Default users if file doesn't exist
  return [
    {
      id: '1',
      username: 'admin',
      email: 'admin@nova.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      password: 'admin123', // In real app, this would be hashed
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      username: 'staff1',
      email: 'staff1@nova.com',
      firstName: 'Staff',
      lastName: 'Member',
      role: 'staff',
      password: 'staff123', // In real app, this would be hashed
      createdAt: new Date().toISOString()
    }
  ];
}

// Function to save users to file
function saveUsers(users) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

// Load users from persistent storage
let users = loadUsers();

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

// Debug endpoint to check current user data
app.get('/api/debug/users', (req, res) => {
  res.json({
    users: users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }),
    fileExists: fs.existsSync(usersFilePath),
    filePath: usersFilePath
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

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Find user by username
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Check password (in real app, this would be hashed comparison)
  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Return user data without password
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    token: 'test-token-' + Date.now(),
    user: userWithoutPassword
  });
});

// Get all users (admin only)
app.get('/api/auth/users', (req, res) => {
  // Return users without passwords
  const usersWithoutPasswords = users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
  
  res.json({
    users: usersWithoutPasswords
  });
});

// Register new user
app.post('/api/auth/register', (req, res) => {
  const { username, email, firstName, lastName, role, password } = req.body;
  
  if (!username || !email || !firstName || !lastName || !role || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if username already exists
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Check if email already exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  // Create new user
  const newUser = {
    id: Date.now().toString(),
    username,
    email,
    firstName,
    lastName,
    role,
    password, // In real app, this would be hashed
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  
  // Save to persistent storage
  saveUsers(users);

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  
  res.json({
    message: 'User created successfully',
    user: userWithoutPassword
  });
});

// Update user
app.put('/api/auth/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, firstName, lastName, role, password } = req.body;
  
  if (!username || !email || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'Username, email, first name, last name, and role are required' });
  }

  // Find user by ID
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if username is being changed and if it already exists
  if (username !== users[userIndex].username && users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Check if email is being changed and if it already exists
  if (email !== users[userIndex].email && users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  // Update user
  users[userIndex] = {
    ...users[userIndex],
    username,
    email,
    firstName,
    lastName,
    role,
    ...(password && { password }) // Only update password if provided
  };

  // Save to persistent storage
  saveUsers(users);

  // Return updated user without password
  const { password: _, ...userWithoutPassword } = users[userIndex];
  
  res.json({
    message: 'User updated successfully',
    user: userWithoutPassword
  });
});

// Delete user
app.delete('/api/auth/users/:id', (req, res) => {
  const { id } = req.params;
  
  // Find user by ID
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Remove user from array
  users.splice(userIndex, 1);
  
  // Save to persistent storage
  saveUsers(users);
  
  res.json({ message: 'User deleted successfully' });
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

// Athletes search endpoint
app.get('/api/athletes/search', (req, res) => {
  const { query } = req.query;
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

// Legacy stats endpoint
app.get('/api/checkins/stats', (req, res) => {
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

app.get('/api/events/disabled', (req, res) => {
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
