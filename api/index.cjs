const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Default user data
const defaultUsers = [
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

// Function to get users (with persistence attempt)
function getUsers() {
  try {
    if (fs.existsSync('/tmp/users.json')) {
      const data = fs.readFileSync('/tmp/users.json', 'utf8');
      const parsed = JSON.parse(data);
      console.log('Loaded users from file:', parsed.length);
      return parsed;
    }
  } catch (error) {
    console.error('Error loading users from file:', error);
  }
  console.log('Using default users');
  return JSON.parse(JSON.stringify(defaultUsers)); // Deep copy
}

// Function to save users to file
function saveUsers(users) {
  try {
    const data = JSON.stringify(users, null, 2);
    fs.writeFileSync('/tmp/users.json', data);
    console.log('Saved users to file:', users.length);
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
}

// Initialize users
let users = getUsers();

// Initialize athletes and events data
let athletes = [
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
];

let events = [
  {
    id: '1',
    name: 'Practice Session',
    description: 'Regular volleyball practice',
    date: '2025-08-09',
    startTime: '18:00',
    endTime: '20:00',
    maxCapacity: 20,
    currentCapacity: 0,
    isActive: true,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let checkIns = [];

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
    fileExists: fs.existsSync('/tmp/users.json'),
    filePath: '/tmp/users.json',
    userCount: users.length
  });
});

// Reset users to default (for testing)
app.post('/api/debug/reset-users', (req, res) => {
  users = [...defaultUsers];
  saveUsers(users);
  res.json({ 
    message: 'Users reset to default',
    users: users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    })
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

// Athletes endpoints
app.get('/api/athletes', (req, res) => {
  res.json({ athletes });
});

app.post('/api/athletes', (req, res) => {
  const { firstName, lastName, email, phone, dateOfBirth, emergencyContact, emergencyContactEmail, emergencyPhone } = req.body;
  
  if (!firstName || !lastName || !dateOfBirth || !emergencyContact || !emergencyPhone) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  const newAthlete = {
    id: Date.now().toString(),
    firstName,
    lastName,
    email: email || '',
    phone: phone || '',
    dateOfBirth,
    emergencyContact,
    emergencyContactEmail: emergencyContactEmail || '',
    emergencyPhone,
    hasValidWaiver: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  athletes.push(newAthlete);
  res.json({ message: 'Athlete created successfully', athlete: newAthlete });
});

app.put('/api/athletes/:id', (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, dateOfBirth, emergencyContact, emergencyContactEmail, emergencyPhone, hasValidWaiver } = req.body;
  
  const athleteIndex = athletes.findIndex(a => a.id === id);
  if (athleteIndex === -1) {
    return res.status(404).json({ error: 'Athlete not found' });
  }

  athletes[athleteIndex] = {
    ...athletes[athleteIndex],
    firstName,
    lastName,
    email: email || '',
    phone: phone || '',
    dateOfBirth,
    emergencyContact,
    emergencyContactEmail: emergencyContactEmail || '',
    emergencyPhone,
    hasValidWaiver: hasValidWaiver || false,
    updatedAt: new Date().toISOString()
  };

  res.json({ message: 'Athlete updated successfully', athlete: athletes[athleteIndex] });
});

app.delete('/api/athletes/:id', (req, res) => {
  const { id } = req.params;
  
  const athleteIndex = athletes.findIndex(a => a.id === id);
  if (athleteIndex === -1) {
    return res.status(404).json({ error: 'Athlete not found' });
  }

  athletes.splice(athleteIndex, 1);
  res.json({ message: 'Athlete deleted successfully' });
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

// Events endpoints
app.get('/api/events', (req, res) => {
  res.json({ events });
});

app.post('/api/events', (req, res) => {
  const { name, description, date, startTime, endTime, maxCapacity } = req.body;
  
  if (!name || !date || !startTime || !endTime || !maxCapacity) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  const newEvent = {
    id: Date.now().toString(),
    name,
    description: description || '',
    date,
    startTime,
    endTime,
    maxCapacity: parseInt(maxCapacity),
    currentCapacity: 0,
    isActive: true,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  events.push(newEvent);
  res.json({ message: 'Event created successfully', event: newEvent });
});

app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, date, startTime, endTime, maxCapacity, isActive } = req.body;
  
  const eventIndex = events.findIndex(e => e.id === id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  events[eventIndex] = {
    ...events[eventIndex],
    name,
    description: description || '',
    date,
    startTime,
    endTime,
    maxCapacity: parseInt(maxCapacity),
    isActive: isActive !== undefined ? isActive : events[eventIndex].isActive,
    updatedAt: new Date().toISOString()
  };

  res.json({ message: 'Event updated successfully', event: events[eventIndex] });
});

app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  
  const eventIndex = events.findIndex(e => e.id === id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  events.splice(eventIndex, 1);
  res.json({ message: 'Event deleted successfully' });
});

// Check-ins endpoints
app.get('/api/checkins', (req, res) => {
  res.json({ checkins });
});

app.post('/api/checkins', (req, res) => {
  const { athleteId, eventId, notes } = req.body;
  
  if (!athleteId || !eventId) {
    return res.status(400).json({ error: 'Athlete ID and Event ID are required' });
  }

  const athlete = athletes.find(a => a.id === athleteId);
  const event = events.find(e => e.id === eventId);
  
  if (!athlete) {
    return res.status(404).json({ error: 'Athlete not found' });
  }
  
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const newCheckIn = {
    id: Date.now().toString(),
    athleteId,
    eventId,
    checkInTime: new Date().toISOString(),
    waiverValidated: athlete.hasValidWaiver,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    eventName: event.name
  };

  checkIns.push(newCheckIn);
  
  // Update event capacity
  event.currentCapacity += 1;
  
  res.json({ message: 'Check-in successful', checkIn: newCheckIn });
});

// Stats endpoints
app.get('/api/checkins/stats/overview', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayCheckIns = checkIns.filter(checkIn => 
    checkIn.checkInTime.startsWith(today)
  );
  
  const stats = {
    today: todayCheckIns.length,
    total: checkIns.length,
    waiverValidated: checkIns.filter(c => c.waiverValidated).length,
    waiverNotValidated: checkIns.filter(c => !c.waiverValidated).length
  };
  
  res.json({ stats });
});

// Legacy stats endpoint
app.get('/api/checkins/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayCheckIns = checkIns.filter(checkIn => 
    checkIn.checkInTime.startsWith(today)
  );
  
  const stats = {
    today: todayCheckIns.length,
    total: checkIns.length,
    waiverValidated: checkIns.filter(c => c.waiverValidated).length,
    waiverNotValidated: checkIns.filter(c => !c.waiverValidated).length
  };
  
  res.json({ stats });
});

// Additional endpoints for the app
app.get('/api/events/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(event => event.date === today && event.isActive);
  res.json({ events: todayEvents });
});

app.get('/api/events/past', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const pastEvents = events.filter(event => event.date < today);
  res.json({ events: pastEvents });
});

app.get('/api/events/disabled', (req, res) => {
  const disabledEvents = events.filter(event => !event.isActive);
  res.json({ events: disabledEvents });
});

app.get('/api/checkins/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayCheckIns = checkIns.filter(checkIn => 
    checkIn.checkInTime.startsWith(today)
  );
  res.json({ checkins: todayCheckIns });
});

module.exports = app;
