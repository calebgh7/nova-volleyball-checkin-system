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

// Global state that persists during function instance lifetime
let globalUsers = null;
let globalAthletes = null;
let globalEvents = null;
let globalCheckIns = null;

// Function to get users (with multiple persistence attempts)
function getUsers() {
  // If we already have users in memory for this function instance, use them
  if (globalUsers) {
    console.log('Using cached users:', globalUsers.length);
    return globalUsers;
  }

  // Try to load from file with more robust error handling
  const paths = [
    '/tmp/users.json',
    '/tmp/nova_users.json',
    '/var/tmp/users.json',
    './users.json',
    '/tmp/nova_data/users.json'
  ];

  for (const path of paths) {
    try {
      if (fs.existsSync(path)) {
        const data = fs.readFileSync(path, 'utf8');
        const parsed = JSON.parse(data);
        console.log('Loaded users from path:', path, parsed.length);
        globalUsers = parsed;
        return parsed;
      }
    } catch (error) {
      console.error('Error loading users from path:', path, error);
    }
  }

  // Try to create directory and save default users
  try {
    fs.mkdirSync('/tmp/nova_data', { recursive: true });
    console.log('Created nova_data directory');
  } catch (error) {
    console.error('Error creating directory:', error);
  }

  console.log('Using default users');
  globalUsers = JSON.parse(JSON.stringify(defaultUsers)); // Deep copy
  
  // Try to save default users to persistent location
  try {
    const data = JSON.stringify(globalUsers, null, 2);
    fs.writeFileSync('/tmp/nova_data/users.json', data);
    console.log('Saved default users to persistent location');
  } catch (error) {
    console.error('Error saving default users:', error);
  }
  
  return globalUsers;
}

// Enhanced save function with better persistence strategy
function saveUsers(users) {
  globalUsers = users; // Update global cache
  
  const paths = [
    '/tmp/users.json',
    '/tmp/nova_users.json',
    '/var/tmp/users.json',
    './users.json',
    '/tmp/nova_data/users.json'
  ];

  let saved = false;
  for (const path of paths) {
    try {
      // Ensure directory exists
      const dir = path.substring(0, path.lastIndexOf('/'));
      if (dir) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const data = JSON.stringify(users, null, 2);
      fs.writeFileSync(path, data);
      console.log('Saved users to:', path, users.length);
      saved = true;
    } catch (error) {
      console.error('Error saving users to:', path, error);
    }
  }
  
  // Also try to create a backup
  try {
    const backupPath = '/tmp/nova_data/backup.json';
    const backup = {
      users: users,
      athletes: athletes,
      events: events,
      checkIns: checkIns,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log('Created backup at:', backupPath);
  } catch (error) {
    console.error('Error creating backup:', error);
  }
  
  return saved;
}



// Initialize users
let users = getUsers();

// Initialize athletes and events data with persistence
function getAthletes() {
  if (globalAthletes) {
    return globalAthletes;
  }
  
  try {
    if (fs.existsSync('/tmp/nova_data/athletes.json')) {
      const data = fs.readFileSync('/tmp/nova_data/athletes.json', 'utf8');
      globalAthletes = JSON.parse(data);
      return globalAthletes;
    }
  } catch (error) {
    console.error('Error loading athletes:', error);
  }
  
  globalAthletes = [
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
  
  // Save to persistent location
  try {
    fs.mkdirSync('/tmp/nova_data', { recursive: true });
    fs.writeFileSync('/tmp/nova_data/athletes.json', JSON.stringify(globalAthletes, null, 2));
  } catch (error) {
    console.error('Error saving default athletes:', error);
  }
  
  return globalAthletes;
}

function getEvents() {
  if (globalEvents) {
    return globalEvents;
  }
  
  try {
    if (fs.existsSync('/tmp/nova_data/events.json')) {
      const data = fs.readFileSync('/tmp/nova_data/events.json', 'utf8');
      globalEvents = JSON.parse(data);
      return globalEvents;
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
  
  globalEvents = [
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
  
  // Save to persistent location
  try {
    fs.mkdirSync('/tmp/nova_data', { recursive: true });
    fs.writeFileSync('/tmp/nova_data/events.json', JSON.stringify(globalEvents, null, 2));
  } catch (error) {
    console.error('Error saving default events:', error);
  }
  
  return globalEvents;
}

function getCheckIns() {
  if (globalCheckIns) {
    return globalCheckIns;
  }
  
  try {
    if (fs.existsSync('/tmp/nova_data/checkins.json')) {
      const data = fs.readFileSync('/tmp/nova_data/checkins.json', 'utf8');
      globalCheckIns = JSON.parse(data);
      return globalCheckIns;
    }
  } catch (error) {
    console.error('Error loading checkins:', error);
  }
  
  globalCheckIns = [];
  
  // Save to persistent location
  try {
    fs.mkdirSync('/tmp/nova_data', { recursive: true });
    fs.writeFileSync('/tmp/nova_data/checkins.json', JSON.stringify(globalCheckIns, null, 2));
  } catch (error) {
    console.error('Error saving default checkins:', error);
  }
  
  return globalCheckIns;
}

// Initialize data
let athletes = getAthletes();
let events = getEvents();
let checkIns = getCheckIns();

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
  const currentUsers = getUsers();
  
  // Check all possible file locations
  const fileLocations = [
    '/tmp/users.json',
    '/tmp/nova_users.json',
    '/var/tmp/users.json',
    './users.json',
    '/tmp/nova_data/users.json'
  ];
  
  const fileStatus = {};
  fileLocations.forEach(path => {
    try {
      fileStatus[path] = {
        exists: fs.existsSync(path),
        size: fs.existsSync(path) ? fs.statSync(path).size : 0
      };
    } catch (error) {
      fileStatus[path] = { exists: false, error: error.message };
    }
  });
  
  res.json({
    users: currentUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }),
    fileStatus,
    userCount: currentUsers.length,
    globalUsersCached: globalUsers !== null,
    globalUsersCount: globalUsers ? globalUsers.length : 0,
    timestamp: new Date().toISOString()
  });
});

// Reset users to default (for testing)
app.post('/api/debug/reset-users', (req, res) => {
  globalUsers = JSON.parse(JSON.stringify(defaultUsers));
  saveUsers(globalUsers);
  res.json({ 
    message: 'Users reset to default',
    users: globalUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    })
  });
});

// Force save users (for testing)
app.post('/api/debug/save-users', (req, res) => {
  const currentUsers = getUsers();
  const saved = saveUsers(currentUsers);
  res.json({ 
    message: saved ? 'Users saved successfully' : 'Failed to save users',
    userCount: currentUsers.length,
    saved
  });
});

// Backup and restore system
app.post('/api/debug/backup-data', (req, res) => {
  try {
    const backup = {
      users: getUsers(),
      athletes: athletes,
      events: events,
      checkIns: checkIns,
      timestamp: new Date().toISOString()
    };
    
    const backupPath = '/tmp/nova_data/backup.json';
    fs.mkdirSync('/tmp/nova_data', { recursive: true });
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    res.json({ 
      message: 'Backup created successfully',
      backupPath,
      dataSize: JSON.stringify(backup).length
    });
  } catch (error) {
    res.status(500).json({ error: 'Backup failed', details: error.message });
  }
});

app.post('/api/debug/restore-data', (req, res) => {
  try {
    const backupPath = '/tmp/nova_data/backup.json';
    if (fs.existsSync(backupPath)) {
      const data = fs.readFileSync(backupPath, 'utf8');
      const backup = JSON.parse(data);
      
      globalUsers = backup.users;
      athletes = backup.athletes || athletes;
      events = backup.events || events;
      checkIns = backup.checkIns || checkIns;
      
      // Save to all locations
      saveUsers(globalUsers);
      
      res.json({ 
        message: 'Data restored successfully',
        users: globalUsers.length,
        athletes: athletes.length,
        events: events.length,
        checkIns: checkIns.length
      });
    } else {
      res.status(404).json({ error: 'No backup found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Restore failed', details: error.message });
  }
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

  const currentUsers = getUsers();
  
  // Find user by username
  const user = currentUsers.find(u => u.username === username);
  
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
  const currentUsers = getUsers();
  
  // Return users without passwords
  const usersWithoutPasswords = currentUsers.map(user => {
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

  const currentUsers = getUsers();

  // Check if username already exists
  if (currentUsers.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Check if email already exists
  if (currentUsers.find(u => u.email === email)) {
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

  currentUsers.push(newUser);
  
  // Save to persistent storage
  saveUsers(currentUsers);

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

  const currentUsers = getUsers();

  // Find user by ID
  const userIndex = currentUsers.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if username is being changed and if it already exists
  if (username !== currentUsers[userIndex].username && currentUsers.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Check if email is being changed and if it already exists
  if (email !== currentUsers[userIndex].email && currentUsers.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  // Update user
  currentUsers[userIndex] = {
    ...currentUsers[userIndex],
    username,
    email,
    firstName,
    lastName,
    role,
    ...(password && { password }) // Only update password if provided
  };

  // Save to persistent storage
  saveUsers(currentUsers);

  // Return updated user without password
  const { password: _, ...userWithoutPassword } = currentUsers[userIndex];
  
  res.json({
    message: 'User updated successfully',
    user: userWithoutPassword
  });
});

// Delete user
app.delete('/api/auth/users/:id', (req, res) => {
  const { id } = req.params;
  
  const currentUsers = getUsers();
  
  // Find user by ID
  const userIndex = currentUsers.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Remove user from array
  currentUsers.splice(userIndex, 1);
  
  // Save to persistent storage
  saveUsers(currentUsers);
  
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
