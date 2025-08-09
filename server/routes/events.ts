import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../database';

const router = express.Router();

// Get today's events
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const db = dbManager.getDatabase();
    
    const events = await db.all(`
      SELECT * FROM events 
      WHERE date = ? AND isActive = 1
      ORDER BY startTime ASC
    `, [today]);
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching today\'s events:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s events' });
  }
});

// Get disabled events
router.get('/disabled', async (req, res) => {
  try {
    const db = dbManager.getDatabase();
    
    const events = await db.all(`
      SELECT * FROM events 
      WHERE isActive = 0
      ORDER BY date DESC, startTime DESC
    `);
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching disabled events:', error);
    res.status(500).json({ error: 'Failed to fetch disabled events' });
  }
});

// Get past events
router.get('/past', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const db = dbManager.getDatabase();
    
    const events = await db.all(`
      SELECT * FROM events 
      WHERE date < ?
      ORDER BY date DESC, startTime DESC
      LIMIT 10
    `, [today]);
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching past events:', error);
    res.status(500).json({ error: 'Failed to fetch past events' });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const db = dbManager.getDatabase();
    const events = await db.all(`
      SELECT * FROM events 
      ORDER BY date DESC, startTime DESC
    `);
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = dbManager.getDatabase();
    
    const event = await db.get('SELECT * FROM events WHERE id = ?', [id]);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      startTime,
      endTime,
      maxCapacity,
      createdBy
    } = req.body;

    if (!name || !date || !startTime || !endTime || !maxCapacity || !createdBy) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const db = dbManager.getDatabase();
    const eventId = uuidv4();
    const now = new Date().toISOString();

    await db.run(`
      INSERT INTO events (
        id, name, description, date, startTime, endTime, 
        maxCapacity, currentCapacity, isActive, createdBy,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, TRUE, ?, ?, ?)
    `, [
      eventId, name, description || '', date, startTime, endTime, 
      maxCapacity, createdBy, now, now
    ]);

    const newEvent = await db.get('SELECT * FROM events WHERE id = ?', [eventId]);
    
    res.status(201).json({ 
      message: 'Event created successfully',
      event: newEvent 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      date,
      startTime,
      endTime,
      maxCapacity,
      isActive
    } = req.body;

    if (!name || !date || !startTime || !endTime || !maxCapacity) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const db = dbManager.getDatabase();
    
    // Check if event exists
    const existingEvent = await db.get('SELECT id FROM events WHERE id = ?', [id]);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const now = new Date().toISOString();

    await db.run(`
      UPDATE events SET 
        name = ?, description = ?, date = ?, startTime = ?, endTime = ?,
        maxCapacity = ?, isActive = ?, updatedAt = ?
      WHERE id = ?
    `, [
      name, description || '', date, startTime, endTime,
      maxCapacity, isActive !== undefined ? isActive : true, now, id
    ]);

    const updatedEvent = await db.get('SELECT * FROM events WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Event updated successfully',
      event: updatedEvent 
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Toggle event active status (staff/admin only)
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const db = dbManager.getDatabase();
    
    const existingEvent = await db.get('SELECT isActive FROM events WHERE id = ?', [id]);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const newStatus = !existingEvent.isActive;
    const now = new Date().toISOString();
    
    await db.run(
      'UPDATE events SET isActive = ?, updatedAt = ? WHERE id = ?',
      [newStatus, now, id]
    );

    const updatedEvent = await db.get('SELECT * FROM events WHERE id = ?', [id]);
    res.json({ 
      event: updatedEvent, 
      message: `Event ${newStatus ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error('Toggle event error:', error);
    res.status(500).json({ error: 'Failed to toggle event status' });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = dbManager.getDatabase();
    
    // Check if event exists
    const existingEvent = await db.get('SELECT id FROM events WHERE id = ?', [id]);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event has any check-ins
    const checkins = await db.get(
      'SELECT id FROM checkins WHERE eventId = ? LIMIT 1', 
      [id]
    );
    if (checkins) {
      return res.status(400).json({ 
        error: 'Cannot delete event with existing check-ins' 
      });
    }

    await db.run('DELETE FROM events WHERE id = ?', [id]);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get event statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const db = dbManager.getDatabase();
    
    const event = await db.get('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const totalCheckins = await db.get(
      'SELECT COUNT(*) as count FROM checkins WHERE eventId = ?',
      [id]
    );

    const waiverValidated = await db.get(
      'SELECT COUNT(*) as count FROM checkins WHERE eventId = ? AND waiverValidated = 1',
      [id]
    );

    const waiverNotValidated = await db.get(
      'SELECT COUNT(*) as count FROM checkins WHERE eventId = ? AND waiverValidated = 0',
      [id]
    );

    const stats = {
      totalCheckins: totalCheckins.count,
      waiverValidated: waiverValidated.count,
      waiverNotValidated: waiverNotValidated.count,
      capacityUsed: (totalCheckins.count / event.maxCapacity * 100).toFixed(1)
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({ error: 'Failed to get event statistics' });
  }
});

export default router;
