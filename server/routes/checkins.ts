import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../database';

const router = express.Router();

// Get today's check-ins
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const db = dbManager.getDatabase();
    
    const checkins = await db.all(`
      SELECT c.*, a.firstName, a.lastName, a.email, e.name as eventName, e.date as eventDate
      FROM checkins c
      JOIN athletes a ON c.athleteId = a.id
      JOIN events e ON c.eventId = e.id
      WHERE DATE(c.checkInTime) = ?
      ORDER BY c.checkInTime DESC
    `, [today]);
    
    res.json({ checkins });
  } catch (error) {
    console.error('Error fetching today\'s check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s check-ins' });
  }
});

// Get all check-ins
router.get('/', async (req, res) => {
  try {
    const db = dbManager.getDatabase();
    const checkins = await db.all(`
      SELECT c.*, a.firstName, a.lastName, a.email, e.name as eventName, e.date as eventDate
      FROM checkins c
      JOIN athletes a ON c.athleteId = a.id
      JOIN events e ON c.eventId = e.id
      ORDER BY c.checkInTime DESC
    `);
    
    res.json({ checkins });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

// Get check-in by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = dbManager.getDatabase();
    
    const checkin = await db.get(`
      SELECT c.*, a.firstName, a.lastName, a.email, e.name as eventName, e.date as eventDate
      FROM checkins c
      JOIN athletes a ON c.athleteId = a.id
      JOIN events e ON c.eventId = e.id
      WHERE c.id = ?
    `, [id]);
    
    if (!checkin) {
      return res.status(404).json({ error: 'Check-in not found' });
    }
    
    res.json({ checkin });
  } catch (error) {
    console.error('Error fetching check-in:', error);
    res.status(500).json({ error: 'Failed to fetch check-in' });
  }
});

// Create new check-in
router.post('/', async (req, res) => {
  try {
    const {
      athleteId,
      eventId,
      waiverValidated,
      notes
    } = req.body;

    if (!athleteId || !eventId || waiverValidated === undefined) {
      return res.status(400).json({ error: 'Athlete ID, event ID, and waiver validation status are required' });
    }

    const db = dbManager.getDatabase();
    
    // Check if athlete exists
    const athlete = await db.get('SELECT id FROM athletes WHERE id = ?', [athleteId]);
    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    // Check if event exists and is active
    const event = await db.get('SELECT id, isActive, maxCapacity, currentCapacity FROM events WHERE id = ?', [eventId]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.isActive) {
      return res.status(400).json({ error: 'Event is not active' });
    }

    if (event.currentCapacity >= event.maxCapacity) {
      return res.status(400).json({ error: 'Event is at maximum capacity' });
    }

    // Check if athlete is already checked in for this event
    const existingCheckin = await db.get(
      'SELECT id FROM checkins WHERE athleteId = ? AND eventId = ?', 
      [athleteId, eventId]
    );
    if (existingCheckin) {
      return res.status(400).json({ error: 'Athlete is already checked in for this event' });
    }

    const checkinId = uuidv4();
    const now = new Date().toISOString();

    // Start a transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Create the check-in
      await db.run(`
        INSERT INTO checkins (
          id, athleteId, eventId, checkInTime, waiverValidated, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [checkinId, athleteId, eventId, now, waiverValidated, notes || '', now]);

      // Update event capacity
      await db.run(
        'UPDATE events SET currentCapacity = currentCapacity + 1 WHERE id = ?',
        [eventId]
      );

      // Update athlete's last visited date
      await db.run(
        'UPDATE athletes SET lastVisited = ? WHERE id = ?',
        [now, athleteId]
      );

      await db.run('COMMIT');

      const newCheckin = await db.get(`
        SELECT c.*, a.firstName, a.lastName, a.email, e.name as eventName, e.date as eventDate
        FROM checkins c
        JOIN athletes a ON c.athleteId = a.id
        JOIN events e ON c.eventId = e.id
        WHERE c.id = ?
      `, [checkinId]);
      
      res.status(201).json({ 
        message: 'Check-in created successfully',
        checkin: newCheckin 
      });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating check-in:', error);
    res.status(500).json({ error: 'Failed to create check-in' });
  }
});

// Update check-in
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      waiverValidated,
      notes
    } = req.body;

    if (waiverValidated === undefined) {
      return res.status(400).json({ error: 'Waiver validation status is required' });
    }

    const db = dbManager.getDatabase();
    
    // Check if check-in exists
    const existingCheckin = await db.get('SELECT id FROM checkins WHERE id = ?', [id]);
    if (!existingCheckin) {
      return res.status(404).json({ error: 'Check-in not found' });
    }

    await db.run(`
      UPDATE checkins SET 
        waiverValidated = ?, notes = ?
      WHERE id = ?
    `, [waiverValidated, notes || '', id]);

    const updatedCheckin = await db.get(`
      SELECT c.*, a.firstName, a.lastName, a.email, e.name as eventName, e.date as eventDate
      FROM checkins c
      JOIN athletes a ON c.athleteId = a.id
      JOIN events e ON c.eventId = e.id
      WHERE c.id = ?
    `, [id]);
    
    res.json({ 
      message: 'Check-in updated successfully',
      checkin: updatedCheckin 
    });
  } catch (error) {
    console.error('Error updating check-in:', error);
    res.status(500).json({ error: 'Failed to update check-in' });
  }
});

// Delete check-in
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = dbManager.getDatabase();
    
    // Check if check-in exists
    const existingCheckin = await db.get('SELECT id, eventId FROM checkins WHERE id = ?', [id]);
    if (!existingCheckin) {
      return res.status(404).json({ error: 'Check-in not found' });
    }

    // Start a transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Delete the check-in
      await db.run('DELETE FROM checkins WHERE id = ?', [id]);

      // Update event capacity
      await db.run(
        'UPDATE events SET currentCapacity = currentCapacity - 1 WHERE id = ?',
        [existingCheckin.eventId]
      );

      await db.run('COMMIT');
      
      res.json({ message: 'Check-in deleted successfully' });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting check-in:', error);
    res.status(500).json({ error: 'Failed to delete check-in' });
  }
});

// Get check-ins by athlete
router.get('/athlete/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const db = dbManager.getDatabase();
    
    const checkins = await db.all(`
      SELECT c.*, e.name as eventName, e.date as eventDate
      FROM checkins c
      JOIN events e ON c.eventId = e.id
      WHERE c.athleteId = ?
      ORDER BY c.checkInTime DESC
    `, [athleteId]);
    
    res.json({ checkins });
  } catch (error) {
    console.error('Error fetching athlete check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch athlete check-ins' });
  }
});

// Get check-ins by event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const db = dbManager.getDatabase();
    
    const checkins = await db.all(`
      SELECT c.*, a.firstName, a.lastName, a.email
      FROM checkins c
      JOIN athletes a ON c.athleteId = a.id
      WHERE c.eventId = ?
      ORDER BY c.checkInTime DESC
    `, [eventId]);
    
    res.json({ checkins });
  } catch (error) {
    console.error('Error fetching event check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch event check-ins' });
  }
});

// Get check-in statistics (legacy endpoint)
router.get('/stats', async (req, res) => {
  try {
    const db = dbManager.getDatabase();
    
    // Get today's check-ins
    const today = new Date().toISOString().split('T')[0];
    const todayCheckins = await db.get(
      'SELECT COUNT(*) as count FROM checkins WHERE DATE(checkInTime) = ?',
      [today]
    );

    // Get this week's check-ins
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCheckins = await db.get(
      'SELECT COUNT(*) as count FROM checkins WHERE checkInTime >= ?',
      [weekAgo.toISOString()]
    );

    // Get total check-ins
    const totalCheckins = await db.get('SELECT COUNT(*) as count FROM checkins');

    // Get waiver validation stats
    const waiverStats = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN waiverValidated = 1 THEN 1 ELSE 0 END) as validated,
        SUM(CASE WHEN waiverValidated = 0 THEN 1 ELSE 0 END) as notValidated
      FROM checkins
    `);

    res.json({
      stats: {
        today: todayCheckins.count,
        thisWeek: weekCheckins.count,
        total: totalCheckins.count,
        waiverValidated: waiverStats.validated,
        waiverNotValidated: waiverStats.notValidated
      }
    });
  } catch (error) {
    console.error('Error fetching check-in stats:', error);
    res.status(500).json({ error: 'Failed to fetch check-in statistics' });
  }
});

// Get check-in statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const db = dbManager.getDatabase();
    
    // Get today's check-ins
    const today = new Date().toISOString().split('T')[0];
    const todayCheckins = await db.get(
      'SELECT COUNT(*) as count FROM checkins WHERE DATE(checkInTime) = ?',
      [today]
    );

    // Get this week's check-ins
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCheckins = await db.get(
      'SELECT COUNT(*) as count FROM checkins WHERE checkInTime >= ?',
      [weekAgo.toISOString()]
    );

    // Get total check-ins
    const totalCheckins = await db.get('SELECT COUNT(*) as count FROM checkins');

    // Get waiver validation stats
    const waiverStats = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN waiverValidated = 1 THEN 1 ELSE 0 END) as validated,
        SUM(CASE WHEN waiverValidated = 0 THEN 1 ELSE 0 END) as notValidated
      FROM checkins
    `);

    res.json({
      stats: {
        today: todayCheckins.count,
        thisWeek: weekCheckins.count,
        total: totalCheckins.count,
        waiverValidated: waiverStats.validated,
        waiverNotValidated: waiverStats.notValidated
      }
    });
  } catch (error) {
    console.error('Error fetching check-in stats:', error);
    res.status(500).json({ error: 'Failed to fetch check-in statistics' });
  }
});

export default router;
