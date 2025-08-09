import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
let db: Database | null = null;

async function initializeDatabase() {
  if (!db) {
    db = await open({
      filename: '/tmp/volleyball_checkin.db',
      driver: sqlite3.Database
    });
    
    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS athletes (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        dateOfBirth TEXT NOT NULL,
        emergencyContact TEXT NOT NULL,
        emergencyContactEmail TEXT NOT NULL,
        emergencyPhone TEXT NOT NULL,
        hasValidWaiver BOOLEAN DEFAULT FALSE,
        waiverSignedDate TEXT,
        waiverExpirationDate TEXT,
        lastVisited TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        maxCapacity INTEGER NOT NULL,
        currentCapacity INTEGER DEFAULT 0,
        isActive BOOLEAN DEFAULT TRUE,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS checkins (
        id TEXT PRIMARY KEY,
        athleteId TEXT NOT NULL,
        eventId TEXT NOT NULL,
        checkInTime TEXT NOT NULL,
        waiverValidated BOOLEAN NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (athleteId) REFERENCES athletes (id),
        FOREIGN KEY (eventId) REFERENCES events (id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'staff')) NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Create default admin user if none exists
    const adminExists = await db.get('SELECT id FROM users WHERE role = ?', ['admin']);
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const now = new Date().toISOString();
      await db.run(
        'INSERT INTO users (id, username, email, password, role, firstName, lastName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), 'admin', 'admin@nova.com', hashedPassword, 'admin', 'Admin', 'User', now, now]
      );
    }
  }
}

// Initialize database on startup
initializeDatabase();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!db) {
      await initializeDatabase();
    }
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await db!.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Athletes routes
app.get('/api/athletes', async (req, res) => {
  try {
    if (!db) {
      await initializeDatabase();
    }
    
    const athletes = await db!.all('SELECT * FROM athletes ORDER BY createdAt DESC');
    res.json({ athletes });
  } catch (error) {
    console.error('Get athletes error:', error);
    res.status(500).json({ error: 'Failed to get athletes' });
  }
});

// Events routes
app.get('/api/events', async (req, res) => {
  try {
    if (!db) {
      await initializeDatabase();
    }
    
    const events = await db!.all('SELECT * FROM events ORDER BY date DESC');
    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Check-ins routes
app.get('/api/checkins', async (req, res) => {
  try {
    if (!db) {
      await initializeDatabase();
    }
    
    const checkins = await db!.all(`
      SELECT c.*, a.firstName, a.lastName, e.name as eventName 
      FROM checkins c 
      JOIN athletes a ON c.athleteId = a.id 
      JOIN events e ON c.eventId = e.id 
      ORDER BY c.checkInTime DESC
    `);
    res.json({ checkins });
  } catch (error) {
    console.error('Get checkins error:', error);
    res.status(500).json({ error: 'Failed to get checkins' });
  }
});

// Stats route
app.get('/api/checkins/stats/overview', async (req, res) => {
  try {
    if (!db) {
      await initializeDatabase();
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayCheckins = await db!.get('SELECT COUNT(*) as count FROM checkins WHERE DATE(checkInTime) = ?', [today]);
    const totalCheckins = await db!.get('SELECT COUNT(*) as count FROM checkins', []);
    const waiverValidated = await db!.get('SELECT COUNT(*) as count FROM checkins WHERE waiverValidated = 1', []);
    const waiverNotValidated = await db!.get('SELECT COUNT(*) as count FROM checkins WHERE waiverValidated = 0', []);
    
    res.json({
      stats: {
        today: todayCheckins.count,
        total: totalCheckins.count,
        waiverValidated: waiverValidated.count,
        waiverNotValidated: waiverNotValidated.count
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default app;
