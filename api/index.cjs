const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory storage
let users = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@nova.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    password: 'admin123',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    username: 'staff1',
    email: 'staff1@nova.com',
    firstName: 'Staff',
    lastName: 'Member',
    role: 'staff',
    password: 'staff123',
    createdAt: new Date().toISOString()
  }
];

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Nova Volleyball Check-in API is running!'
  });
});

// Debug endpoint
app.get('/api/debug/users', (req, res) => {
  res.json({
    users: users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }),
    userCount: users.length,
    timestamp: new Date().toISOString(),
    storage: 'In-Memory'
  });
});

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = users.find(u => u.username === username);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    token: 'test-token-' + Date.now(),
    user: userWithoutPassword
  });
});

// Get all users
app.get('/api/auth/users', (req, res) => {
  const usersWithoutPasswords = users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
  
  res.json({ users: usersWithoutPasswords });
});

// Update user
app.put('/api/auth/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, firstName, lastName, role, password } = req.body;
  
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users[userIndex] = {
    ...users[userIndex],
    username,
    email,
    firstName,
    lastName,
    role,
    ...(password && { password })
  };

  const { password: _, ...userWithoutPassword } = users[userIndex];
  
  res.json({
    message: 'User updated successfully',
    user: userWithoutPassword
  });
});

// Athletes endpoints
app.get('/api/athletes', (req, res) => {
  res.json({ athletes });
});

app.post('/api/athletes', (req, res) => {
  const { firstName, lastName, email, phone, dateOfBirth, emergencyContact, emergencyContactEmail, emergencyPhone } = req.body;
  
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

// Events endpoints
app.get('/api/events', (req, res) => {
  res.json({ events });
});

app.post('/api/events', (req, res) => {
  const { name, description, date, startTime, endTime, maxCapacity } = req.body;
  
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
  res.json({ checkins: checkIns });
});

app.post('/api/checkins', (req, res) => {
  const { athleteId, eventId, notes } = req.body;
  
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

// Additional endpoints
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

app.get('/api/athletes/search', (req, res) => {
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
});

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// Catch all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

module.exports = app;
