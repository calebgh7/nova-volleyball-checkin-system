const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Global in-memory storage that persists during function instance lifetime
let globalUsers = null;
let globalAthletes = null;
let globalEvents = null;
let globalCheckIns = null;
let globalBackup = null;

// Database functions with in-memory persistence
async function getUsers() {
  // If we have data in memory, use it
  if (globalUsers) {
    return globalUsers;
  }
  
  // Fallback to default users
  console.log('Using default users');
  globalUsers = [...defaultUsers];
  return globalUsers;
}

async function saveUsers(users) {
  try {
    globalUsers = users;
    console.log('Saved users to memory:', users.length);
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
}

async function getAthletes() {
  if (globalAthletes) {
    return globalAthletes;
  }
  
  const defaultAthletes = [
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
  
  globalAthletes = defaultAthletes;
  return defaultAthletes;
}

async function saveAthletes(athletes) {
  try {
    globalAthletes = athletes;
    return true;
  } catch (error) {
    console.error('Error saving athletes:', error);
    return false;
  }
}

async function getEvents() {
  if (globalEvents) {
    return globalEvents;
  }
  
  const defaultEvents = [
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
  
  globalEvents = defaultEvents;
  return defaultEvents;
}

async function saveEvents(events) {
  try {
    globalEvents = events;
    return true;
  } catch (error) {
    console.error('Error saving events:', error);
    return false;
  }
}

async function getCheckIns() {
  if (globalCheckIns) {
    return globalCheckIns;
  }
  
  globalCheckIns = [];
  return [];
}

async function saveCheckIns(checkIns) {
  try {
    globalCheckIns = checkIns;
    return true;
  } catch (error) {
    console.error('Error saving checkIns:', error);
    return false;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Nova Volleyball Check-in API is running with in-memory persistence!',
    note: 'Data persists during function instance lifetime. For longer persistence, consider using a database service.'
  });
});

// Debug endpoint to check current user data
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json({
      users: users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }),
      userCount: users.length,
      timestamp: new Date().toISOString(),
      storage: 'In-Memory (Function Instance)',
      note: 'Data persists during function instance lifetime. Close browser and reopen to test persistence.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load users', details: error.message });
  }
});

// Reset users to default (for testing)
app.post('/api/debug/reset-users', async (req, res) => {
  try {
    globalUsers = [...defaultUsers];
    res.json({ 
      message: 'Users reset to default',
      users: defaultUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      })
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset users', details: error.message });
  }
});

// Force save users (for testing)
app.post('/api/debug/save-users', async (req, res) => {
  try {
    const currentUsers = await getUsers();
    res.json({ 
      message: 'Users saved to memory',
      userCount: currentUsers.length,
      saved: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save users', details: error.message });
  }
});

// Backup and restore system (in-memory)
app.post('/api/debug/backup-data', async (req, res) => {
  try {
    const backup = {
      users: await getUsers(),
      athletes: await getAthletes(),
      events: await getEvents(),
      checkIns: await getCheckIns(),
      timestamp: new Date().toISOString()
    };
    
    // Store backup in memory
    globalBackup = backup;
    
    res.json({ 
      message: 'Backup created successfully in memory',
      dataSize: JSON.stringify(backup).length
    });
  } catch (error) {
    res.status(500).json({ error: 'Backup failed', details: error.message });
  }
});

app.post('/api/debug/restore-data', async (req, res) => {
  try {
    if (globalBackup) {
      globalUsers = globalBackup.users;
      globalAthletes = globalBackup.athletes;
      globalEvents = globalBackup.events;
      globalCheckIns = globalBackup.checkIns;
      
      res.json({ 
        message: 'Data restored successfully from memory',
        users: globalBackup.users.length,
        athletes: globalBackup.athletes.length,
        events: globalBackup.events.length,
        checkIns: globalBackup.checkIns.length
      });
    } else {
      res.status(404).json({ error: 'No backup found in memory' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Restore failed', details: error.message });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working correctly with in-memory persistence',
    endpoints: [
      '/api/health',
      '/api/test',
      '/api/auth/login',
      '/api/athletes',
      '/api/events',
      '/api/checkins'
    ],
    note: 'This is a development setup. For production, consider using a database service.'
  });
});

// Auth endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const users = await getUsers();
    
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
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get all users (admin only)
app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await getUsers();
    
    // Return users without passwords
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json({
      users: usersWithoutPasswords
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load users', details: error.message });
  }
});

// Register new user
app.post('/api/auth/register', async (req, res) => {
  const { username, email, firstName, lastName, role, password } = req.body;
  
  if (!username || !email || !firstName || !lastName || !role || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const users = await getUsers();

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
    await saveUsers(users);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// Update user
app.put('/api/auth/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, firstName, lastName, role, password } = req.body;
  
  if (!username || !email || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'Username, email, first name, last name, and role are required' });
  }

  try {
    const users = await getUsers();

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
    await saveUsers(users);

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = users[userIndex];
    
    res.json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// Delete user
app.delete('/api/auth/users/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const users = await getUsers();
    
    // Find user by ID
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove user from array
    users.splice(userIndex, 1);
    
    // Save to persistent storage
    await saveUsers(users);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

// Athletes endpoints
app.get('/api/athletes', async (req, res) => {
  try {
    const athletes = await getAthletes();
    res.json({ athletes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load athletes', details: error.message });
  }
});

app.post('/api/athletes', async (req, res) => {
  const { firstName, lastName, email, phone, dateOfBirth, emergencyContact, emergencyContactEmail, emergencyPhone } = req.body;
  
  if (!firstName || !lastName || !dateOfBirth || !emergencyContact || !emergencyPhone) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    const athletes = await getAthletes();

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
    await saveAthletes(athletes);
    
    res.json({ message: 'Athlete created successfully', athlete: newAthlete });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create athlete', details: error.message });
  }
});

app.put('/api/athletes/:id', async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, dateOfBirth, emergencyContact, emergencyContactEmail, emergencyPhone, hasValidWaiver } = req.body;
  
  try {
    const athletes = await getAthletes();
    
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

    await saveAthletes(athletes);
    res.json({ message: 'Athlete updated successfully', athlete: athletes[athleteIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update athlete', details: error.message });
  }
});

app.delete('/api/athletes/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const athletes = await getAthletes();
    
    const athleteIndex = athletes.findIndex(a => a.id === id);
    if (athleteIndex === -1) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    athletes.splice(athleteIndex, 1);
    await saveAthletes(athletes);
    
    res.json({ message: 'Athlete deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete athlete', details: error.message });
  }
});

// Athletes search endpoint
app.get('/api/athletes/search', async (req, res) => {
  try {
    const athletes = await getAthletes();
    const { query } = req.query;
    
    if (query) {
      const filtered = athletes.filter(athlete => 
        athlete.firstName.toLowerCase().includes(query.toLowerCase()) ||
        athlete.lastName.toLowerCase().includes(query.toLowerCase()) ||
        athlete.email.toLowerCase().includes(query.toLowerCase())
      );
      res.json({ athletes: filtered });
    } else {
      res.json({ athletes });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to search athletes', details: error.message });
  }
});

// Events endpoints
app.get('/api/events', async (req, res) => {
  try {
    const events = await getEvents();
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load events', details: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  const { name, description, date, startTime, endTime, maxCapacity } = req.body;
  
  if (!name || !date || !startTime || !endTime || !maxCapacity) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    const events = await getEvents();

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
    await saveEvents(events);
    
    res.json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, date, startTime, endTime, maxCapacity, isActive } = req.body;
  
  try {
    const events = await getEvents();
    
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

    await saveEvents(events);
    res.json({ message: 'Event updated successfully', event: events[eventIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const events = await getEvents();
    
    const eventIndex = events.findIndex(e => e.id === id);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    events.splice(eventIndex, 1);
    await saveEvents(events);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
});

// Check-ins endpoints
app.get('/api/checkins', async (req, res) => {
  try {
    const checkIns = await getCheckIns();
    res.json({ checkins: checkIns });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load check-ins', details: error.message });
  }
});

app.post('/api/checkins', async (req, res) => {
  const { athleteId, eventId, notes } = req.body;
  
  if (!athleteId || !eventId) {
    return res.status(400).json({ error: 'Athlete ID and Event ID are required' });
  }

  try {
    const athletes = await getAthletes();
    const events = await getEvents();
    const checkIns = await getCheckIns();

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
    await saveCheckIns(checkIns);
    
    // Update event capacity
    event.currentCapacity += 1;
    await saveEvents(events);
    
    res.json({ message: 'Check-in successful', checkIn: newCheckIn });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create check-in', details: error.message });
  }
});

// Stats endpoints
app.get('/api/checkins/stats/overview', async (req, res) => {
  try {
    const checkIns = await getCheckIns();
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to load stats', details: error.message });
  }
});

// Legacy stats endpoint
app.get('/api/checkins/stats', async (req, res) => {
  try {
    const checkIns = await getCheckIns();
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to load stats', details: error.message });
  }
});

// Additional endpoints for the app
app.get('/api/events/today', async (req, res) => {
  try {
    const events = await getEvents();
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(event => event.date === today && event.isActive);
    res.json({ events: todayEvents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load today\'s events', details: error.message });
  }
});

app.get('/api/events/past', async (req, res) => {
  try {
    const events = await getEvents();
    const today = new Date().toISOString().split('T')[0];
    const pastEvents = events.filter(event => event.date < today);
    res.json({ events: pastEvents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load past events', details: error.message });
  }
});

app.get('/api/events/disabled', async (req, res) => {
  try {
    const events = await getEvents();
    const disabledEvents = events.filter(event => !event.isActive);
    res.json({ events: disabledEvents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load disabled events', details: error.message });
  }
});

app.get('/api/checkins/today', async (req, res) => {
  try {
    const checkIns = await getCheckIns();
    const today = new Date().toISOString().split('T')[0];
    const todayCheckIns = checkIns.filter(checkIn => 
      checkIn.checkInTime.startsWith(today)
    );
    res.json({ checkins: todayCheckIns });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load today\'s check-ins', details: error.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// Catch all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

module.exports = app;
