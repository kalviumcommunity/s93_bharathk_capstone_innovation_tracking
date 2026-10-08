const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. Create a connection pool to the PostgreSQL database
// We use the default postgres user and database running on your local machine
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '8956', // Your local PostgreSQL password
  port: 5432,
});

// 2. Simple helper function to run database queries
// This makes it easy to use in other files: await db.query('SELECT * FROM ...')
const query = async (text, params) => {
  return await pool.query(text, params);
};

// 3. Initialize the database schema and seed data
const initDb = async () => {
  try {
    console.log("Connecting to PostgreSQL...");
    
    // Check if the database is already initialized
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'departments'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("Initializing schema...");
      
      // Read the PostgreSQL schema file and execute it to create tables
      const schemaPath = path.join(__dirname, 'schema_postgres.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await query(schemaSql);
      console.log("Schema initialized successfully.");

      console.log("Seeding initial data...");
      
      // Insert Departments
      await query('INSERT INTO departments (name, code) VALUES ($1, $2)', ['Computer Science', 'CS']);
      await query('INSERT INTO departments (name, code) VALUES ($1, $2)', ['Bioengineering', 'BIO']);
      
      // Insert Innovators
      await query('INSERT INTO innovators (name, email, department_id) VALUES ($1, $2, $3)', ['Dr. Alice Smith', 'alice@uni.edu', 1]);
      await query('INSERT INTO innovators (name, email, department_id) VALUES ($1, $2, $3)', ['Dr. Bob Jones', 'bob@uni.edu', 2]);
      await query('INSERT INTO innovators (name, email, department_id) VALUES ($1, $2, $3)', ['Charlie Brown', 'charlie@uni.edu', 1]);
      
      // Insert Projects. Notice we use "RETURNING id" to get the generated ID back in PostgreSQL
      const proj1Res = await query(
        'INSERT INTO projects (title, description, department_id, status) VALUES ($1, $2, $3, $4) RETURNING id',
        ['AI-driven Drug Discovery', 'Using ML for new compounds', 1, 'ACTIVE']
      );
      const proj1Id = proj1Res.rows[0].id;

      const proj2Res = await query(
        'INSERT INTO projects (title, description, department_id, status) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Prosthetic Limb V2', 'Advanced robotics limb', 2, 'UNDER_REVIEW']
      );
      const proj2Id = proj2Res.rows[0].id;

      // Insert Project Innovators
      await query('INSERT INTO project_innovators (project_id, innovator_id, role) VALUES ($1, $2, $3)', [proj1Id, 1, 'Principal Investigator']);
      await query('INSERT INTO project_innovators (project_id, innovator_id, role) VALUES ($1, $2, $3)', [proj1Id, 3, 'Researcher']);
      await query('INSERT INTO project_innovators (project_id, innovator_id, role) VALUES ($1, $2, $3)', [proj2Id, 2, 'Lead Engineer']);

      // Insert Outputs
      await query(
        'INSERT INTO impact_outputs (project_id, type, title, identifier, impact_score, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [proj1Id, 'PUBLICATION', 'Deep Learning in Pharmacology', 'DOI:10.1234/5678', 5, 'VERIFIED']
      );
      await query(
        'INSERT INTO impact_outputs (project_id, type, title, identifier, impact_score, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [proj2Id, 'PATENT', 'Neural Interface Sensor', 'US-2023-123456', 10, 'PENDING']
      );

      // Insert Audit Logs
      await query(
        'INSERT INTO audit_logs (project_id, action, previous_state, new_state) VALUES ($1, $2, $3, $4)',
        [proj1Id, 'STATUS_CHANGE', 'DRAFT', 'ACTIVE']
      );
      await query(
        'INSERT INTO audit_logs (project_id, action, previous_state, new_state) VALUES ($1, $2, $3, $4)',
        [proj2Id, 'STATUS_CHANGE', 'DRAFT', 'UNDER_REVIEW']
      );

      console.log("Seed data inserted successfully.");
    } else {
      console.log("Database schema already exists. Skipping initialization.");
    }
  } catch (err) {
    console.error("Database initialization error:", err);
  }
};

// Run the initialization when this file is loaded
initDb();

// Export the query function so other files can use it
module.exports = {
  query
};
