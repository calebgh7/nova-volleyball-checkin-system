const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Supabase client
const SUPABASE_CONFIG = require('../supabase-config.cjs');

const supabaseUrl = process.env.SUPABASE_URL || SUPABASE_CONFIG.url;
const supabaseKey = process.env.SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey;

const supabase = createClient(supabaseUrl, supabaseKey);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Nova Volleyball Check-in API is running with Supabase!',
    timestamp: new Date().toISOString(),
    database: 'Supabase PostgreSQL'
  });
});

// Debug endpoint
app.get('/api/debug/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, first_name, last_name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      users: users || [],
      userCount: users ? users.length : 0,
      timestamp: new Date().toISOString(),
      storage: 'Supabase PostgreSQL',
      note: 'Data is now persistent across all sessions!'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// Auth endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // For now, we'll use a simple password check
    // In production, you should use proper password hashing
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (error) throw error;

    const user = users && users[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Simple password check (replace with proper hashing in production)
    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      token: 'test-token-' + Date.now(),
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get all users
app.get('/api/auth/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, first_name, last_name, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    res.json({ users: users || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to load users', details: error.message });
  }
});

// Update user
app.put('/api/auth/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, firstName, lastName, role, password } = req.body;
  
  try {
    const updateData = {
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      ...(password && { password_hash: password }) // In production, hash the password
    };

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, email, first_name, last_name, role, created_at, updated_at')
      .single();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// Athletes endpoints
app.get('/api/athletes', async (req, res) => {
  try {
    const { data: athletes, error } = await supabase
      .from('athletes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    res.json({ athletes: athletes || [] });
  } catch (error) {
    console.error('Error fetching athletes:', error);
    res.status(500).json({ error: 'Failed to load athletes', details: error.message });
  }
});

app.post('/api/athletes', async (req, res) => {
  const { firstName, lastName, email, phone, dateOfBirth, emergencyContact, emergencyContactEmail, emergencyPhone } = req.body;
  
  try {
    const { data: athlete, error } = await supabase
      .from('athletes')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        date_of_birth: dateOfBirth,
        emergency_contact: emergencyContact,
        emergency_contact_email: emergencyContactEmail || null,
        emergency_phone: emergencyPhone,
        has_valid_waiver: false
      })
      .select()
      .single();

    if (error) throw error;
    
    res.json({ message: 'Athlete created successfully', athlete });
  } catch (error) {
    console.error('Error creating athlete:', error);
    res.status(500).json({ error: 'Failed to create athlete', details: error.message });
  }
});

app.put('/api/athletes/:id', async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, dateOfBirth, emergencyContact, emergencyContactEmail, emergencyPhone, hasValidWaiver } = req.body;
  
  try {
    const { data: athlete, error } = await supabase
      .from('athletes')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        date_of_birth: dateOfBirth,
        emergency_contact: emergencyContact,
        emergency_contact_email: emergencyContactEmail || null,
        emergency_phone: emergencyPhone,
        has_valid_waiver: hasValidWaiver || false
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    res.json({ message: 'Athlete updated successfully', athlete });
  } catch (error) {
    console.error('Error updating athlete:', error);
    res.status(500).json({ error: 'Failed to update athlete', details: error.message });
  }
});

app.delete('/api/athletes/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { error } = await supabase
      .from('athletes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    res.json({ message: 'Athlete deleted successfully' });
  } catch (error) {
    console.error('Error deleting athlete:', error);
    res.status(500).json({ error: 'Failed to delete athlete', details: error.message });
  }
});

// Events endpoints
app.get('/api/events', async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    res.json({ events: events || [] });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to load events', details: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  const { name, description, date, startTime, endTime, maxCapacity } = req.body;
  
  try {
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        name,
        description: description || null,
        date,
        start_time: startTime,
        end_time: endTime,
        max_capacity: parseInt(maxCapacity),
        current_capacity: 0,
        is_active: true,
        created_by: null // You can set this to the current user's ID
      })
      .select()
      .single();

    if (error) throw error;
    
    res.json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, date, startTime, endTime, maxCapacity, isActive } = req.body;
  
  try {
    const { data: event, error } = await supabase
      .from('events')
      .update({
        name,
        description: description || null,
        date,
        start_time: startTime,
        end_time: endTime,
        max_capacity: parseInt(maxCapacity),
        is_active: isActive !== undefined ? isActive : true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
});

// Check-ins endpoints
app.get('/api/checkins', async (req, res) => {
  try {
    const { data: checkIns, error } = await supabase
      .from('check_ins')
      .select(`
        *,
        athletes (first_name, last_name),
        events (name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data to match the frontend expectations
    const transformedCheckIns = checkIns ? checkIns.map(checkIn => ({
      ...checkIn,
      firstName: checkIn.athletes?.first_name,
      lastName: checkIn.athletes?.last_name,
      eventName: checkIn.events?.name
    })) : [];
    
    res.json({ checkins: transformedCheckIns });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ error: 'Failed to load check-ins', details: error.message });
  }
});

app.post('/api/checkins', async (req, res) => {
  const { athleteId, eventId, notes } = req.body;
  
  try {
    // First, get the athlete to check waiver status
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('has_valid_waiver')
      .eq('id', athleteId)
      .single();

    if (athleteError) throw athleteError;

    // Create the check-in
    const { data: checkIn, error } = await supabase
      .from('check_ins')
      .insert({
        athlete_id: athleteId,
        event_id: eventId,
        waiver_validated: athlete.has_valid_waiver,
        notes: notes || null
      })
      .select(`
        *,
        athletes (first_name, last_name),
        events (name)
      `)
      .single();

    if (error) throw error;

    // Update event capacity
    const { error: capacityError } = await supabase
      .from('events')
      .update({ current_capacity: supabase.rpc('increment') })
      .eq('id', eventId);

    if (capacityError) {
      console.error('Error updating event capacity:', capacityError);
    }

    // Transform the response
    const transformedCheckIn = {
      ...checkIn,
      firstName: checkIn.athletes?.first_name,
      lastName: checkIn.athletes?.last_name,
      eventName: checkIn.events?.name
    };
    
    res.json({ message: 'Check-in successful', checkIn: transformedCheckIn });
  } catch (error) {
    console.error('Error creating check-in:', error);
    res.status(500).json({ error: 'Failed to create check-in', details: error.message });
  }
});

// Stats endpoints
app.get('/api/checkins/stats/overview', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: checkIns, error } = await supabase
      .from('check_ins')
      .select('waiver_validated, check_in_time');

    if (error) throw error;

    const todayCheckIns = checkIns ? checkIns.filter(checkIn => 
      checkIn.check_in_time.startsWith(today)
    ) : [];
    
    const stats = {
      today: todayCheckIns.length,
      total: checkIns ? checkIns.length : 0,
      waiverValidated: checkIns ? checkIns.filter(c => c.waiver_validated).length : 0,
      waiverNotValidated: checkIns ? checkIns.filter(c => !c.waiver_validated).length : 0
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to load stats', details: error.message });
  }
});

app.get('/api/checkins/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: checkIns, error } = await supabase
      .from('check_ins')
      .select('waiver_validated, check_in_time');

    if (error) throw error;

    const todayCheckIns = checkIns ? checkIns.filter(checkIn => 
      checkIn.check_in_time.startsWith(today)
    ) : [];
    
    const stats = {
      today: todayCheckIns.length,
      total: checkIns ? checkIns.length : 0,
      waiverValidated: checkIns ? checkIns.filter(c => c.waiver_validated).length : 0,
      waiverNotValidated: checkIns ? checkIns.filter(c => !c.waiver_validated).length : 0
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to load stats', details: error.message });
  }
});

// Additional endpoints
app.get('/api/events/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('date', today)
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (error) throw error;
    
    res.json({ events: events || [] });
  } catch (error) {
    console.error('Error fetching today\'s events:', error);
    res.status(500).json({ error: 'Failed to load today\'s events', details: error.message });
  }
});

app.get('/api/events/past', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .lt('date', today)
      .order('date', { ascending: false });

    if (error) throw error;
    
    res.json({ events: events || [] });
  } catch (error) {
    console.error('Error fetching past events:', error);
    res.status(500).json({ error: 'Failed to load past events', details: error.message });
  }
});

app.get('/api/events/disabled', async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    res.json({ events: events || [] });
  } catch (error) {
    console.error('Error fetching disabled events:', error);
    res.status(500).json({ error: 'Failed to load disabled events', details: error.message });
  }
});

app.get('/api/checkins/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: checkIns, error } = await supabase
      .from('check_ins')
      .select(`
        *,
        athletes (first_name, last_name),
        events (name)
      `)
      .gte('check_in_time', today + 'T00:00:00')
      .lt('check_in_time', today + 'T23:59:59')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data
    const transformedCheckIns = checkIns ? checkIns.map(checkIn => ({
      ...checkIn,
      firstName: checkIn.athletes?.first_name,
      lastName: checkIn.athletes?.last_name,
      eventName: checkIn.events?.name
    })) : [];
    
    res.json({ checkins: transformedCheckIns });
  } catch (error) {
    console.error('Error fetching today\'s check-ins:', error);
    res.status(500).json({ error: 'Failed to load today\'s check-ins', details: error.message });
  }
});

app.get('/api/athletes/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    let queryBuilder = supabase
      .from('athletes')
      .select('*')
      .order('created_at', { ascending: false });

    if (query) {
      queryBuilder = queryBuilder.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);
    }

    const { data: athletes, error } = await queryBuilder;

    if (error) throw error;
    
    res.json({ athletes: athletes || [] });
  } catch (error) {
    console.error('Error searching athletes:', error);
    res.status(500).json({ error: 'Failed to search athletes', details: error.message });
  }
});

module.exports = app;
