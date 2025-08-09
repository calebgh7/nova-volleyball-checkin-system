
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { dbManager } = require('../database.ts');

async function addAdmin() {
  await dbManager.initialize();
  const db = dbManager.getDatabase();
  const now = new Date().toISOString();
  const hashedPassword = await bcrypt.hash('@zCardinals16', 10);
  await db.run(
    `INSERT INTO users (id, username, email, password, role, firstName, lastName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'calebhobbs', 'calebhobbs@nova.com', hashedPassword, 'admin', 'Caleb', 'Hobbs', now, now]
  );
  console.log('Admin user created');
  process.exit(0);
}

addAdmin().catch(err => {
  console.error('Failed to add admin:', err);
  process.exit(1);
});
