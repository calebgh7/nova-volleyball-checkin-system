import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../database';

const router = express.Router();

// Search athletes by name or email
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const db = dbManager.getDatabase();
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const athletes = await db.all(`
      SELECT * FROM athletes 
      WHERE LOWER(firstName) LIKE ? 
         OR LOWER(lastName) LIKE ? 
         OR LOWER(email) LIKE ?
      ORDER BY firstName, lastName
      LIMIT 20
    `, [searchTerm, searchTerm, searchTerm]);
    
    res.json({ athletes });
  } catch (error) {
    console.error('Error searching athletes:', error);
    res.status(500).json({ error: 'Failed to search athletes' });
  }
});

// Get all athletes
router.get('/', async (req, res) => {
  try {
    const db = dbManager.getDatabase();
    const athletes = await db.all(`
      SELECT * FROM athletes 
      ORDER BY lastName, firstName
    `);
    
    res.json({ athletes });
  } catch (error) {
    console.error('Error fetching athletes:', error);
    res.status(500).json({ error: 'Failed to fetch athletes' });
  }
});

// Get athlete by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = dbManager.getDatabase();
    
    const athlete = await db.get('SELECT * FROM athletes WHERE id = ?', [id]);
    
    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }
    
    res.json({ athlete });
  } catch (error) {
    console.error('Error fetching athlete:', error);
    res.status(500).json({ error: 'Failed to fetch athlete' });
  }
});

// Create new athlete
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      emergencyContact,
      emergencyContactEmail,
      emergencyPhone,
      hasValidWaiver,
      waiverSignedDate,
      waiverExpirationDate
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !dateOfBirth || 
        !emergencyContact || !emergencyContactEmail || !emergencyPhone) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const db = dbManager.getDatabase();
    
    // Check if athlete with same email already exists
    const existingAthlete = await db.get('SELECT id FROM athletes WHERE email = ?', [email]);
    if (existingAthlete) {
      return res.status(400).json({ error: 'Athlete with this email already exists' });
    }

    const athleteId = uuidv4();
    const now = new Date().toISOString();

    await db.run(`
      INSERT INTO athletes (
        id, firstName, lastName, email, phone, dateOfBirth, 
        emergencyContact, emergencyContactEmail, emergencyPhone,
        hasValidWaiver, waiverSignedDate, waiverExpirationDate,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      athleteId, firstName, lastName, email, phone, dateOfBirth,
      emergencyContact, emergencyContactEmail, emergencyPhone,
      hasValidWaiver || false, waiverSignedDate, waiverExpirationDate,
      now, now
    ]);

    const newAthlete = await db.get('SELECT * FROM athletes WHERE id = ?', [athleteId]);
    
    res.status(201).json({ 
      message: 'Athlete created successfully',
      athlete: newAthlete 
    });
  } catch (error) {
    console.error('Error creating athlete:', error);
    res.status(500).json({ error: 'Failed to create athlete' });
  }
});

// Update athlete
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      emergencyContact,
      emergencyContactEmail,
      emergencyPhone,
      hasValidWaiver,
      waiverSignedDate,
      waiverExpirationDate
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !dateOfBirth || 
        !emergencyContact || !emergencyContactEmail || !emergencyPhone) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const db = dbManager.getDatabase();
    
    // Check if athlete exists
    const existingAthlete = await db.get('SELECT id FROM athletes WHERE id = ?', [id]);
    if (!existingAthlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    // Check if email is already used by another athlete
    const duplicateEmail = await db.get(
      'SELECT id FROM athletes WHERE email = ? AND id != ?', 
      [email, id]
    );
    if (duplicateEmail) {
      return res.status(400).json({ error: 'Email is already used by another athlete' });
    }

    const now = new Date().toISOString();

    await db.run(`
      UPDATE athletes SET 
        firstName = ?, lastName = ?, email = ?, phone = ?, dateOfBirth = ?,
        emergencyContact = ?, emergencyContactEmail = ?, emergencyPhone = ?,
        hasValidWaiver = ?, waiverSignedDate = ?, waiverExpirationDate = ?,
        updatedAt = ?
      WHERE id = ?
    `, [
      firstName, lastName, email, phone, dateOfBirth,
      emergencyContact, emergencyContactEmail, emergencyPhone,
      hasValidWaiver || false, waiverSignedDate, waiverExpirationDate,
      now, id
    ]);

    const updatedAthlete = await db.get('SELECT * FROM athletes WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Athlete updated successfully',
      athlete: updatedAthlete 
    });
  } catch (error) {
    console.error('Error updating athlete:', error);
    res.status(500).json({ error: 'Failed to update athlete' });
  }
});

// Delete athlete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = dbManager.getDatabase();
    
    // Check if athlete exists
    const existingAthlete = await db.get('SELECT id FROM athletes WHERE id = ?', [id]);
    if (!existingAthlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    // Check if athlete has any check-ins
    const checkins = await db.get(
      'SELECT id FROM checkins WHERE athleteId = ? LIMIT 1', 
      [id]
    );
    if (checkins) {
      return res.status(400).json({ 
        error: 'Cannot delete athlete with existing check-ins' 
      });
    }

    await db.run('DELETE FROM athletes WHERE id = ?', [id]);
    
    res.json({ message: 'Athlete deleted successfully' });
  } catch (error) {
    console.error('Error deleting athlete:', error);
    res.status(500).json({ error: 'Failed to delete athlete' });
  }
});

export default router;
