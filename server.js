const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// 1. Get Department Analytics Summary
app.get('/api/analytics/department-summary', async (req, res) => {
  try {
    const query = `
      SELECT 
        d.id, 
        d.name,
        COUNT(DISTINCT p.id) as total_projects,
        SUM(CASE WHEN io.type = 'PATENT' THEN 1 ELSE 0 END) as patents,
        SUM(CASE WHEN io.type = 'PUBLICATION' THEN 1 ELSE 0 END) as publications,
        SUM(CASE WHEN io.type = 'TECH_TRANSFER' THEN 1 ELSE 0 END) as tech_transfers,
        COALESCE(SUM(io.impact_score), 0) as total_impact_score
      FROM departments d
      LEFT JOIN projects p ON d.id = p.department_id
      LEFT JOIN impact_outputs io ON p.id = io.project_id
      GROUP BY d.id, d.name
    `;
    const results = await db.query(query);
    // In PostgreSQL (pg library), the result data is inside the .rows property
    res.json(results.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// 2. Get All Projects (with authors and outputs)
app.get('/api/projects', async (req, res) => {
  try {
    const projectsRes = await db.query('SELECT p.*, d.name as department_name FROM projects p JOIN departments d ON p.department_id = d.id');
    const projects = projectsRes.rows;
    
    // Attach innovators and outputs to each project
    for (let p of projects) {
      const innRes = await db.query(`
        SELECT i.name, pi.role 
        FROM project_innovators pi 
        JOIN innovators i ON pi.innovator_id = i.id 
        WHERE pi.project_id = $1
      `, [p.id]);
      p.innovators = innRes.rows;
      
      const outRes = await db.query('SELECT * FROM impact_outputs WHERE project_id = $1', [p.id]);
      p.outputs = outRes.rows;
    }
    
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get projects" });
  }
});

// 3. Create a Project
app.post('/api/projects', async (req, res) => {
  try {
    const { title, description, department_id } = req.body;
    
    // Use RETURNING id to get the ID of the newly created project
    const projectRes = await db.query(
      'INSERT INTO projects (title, description, department_id, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [title, description, department_id, 'DRAFT']
    );
    const projectId = projectRes.rows[0].id;
    
    // Log creation in audit log
    await db.query(
      'INSERT INTO audit_logs (project_id, action, new_state) VALUES ($1, $2, $3)',
      [projectId, 'PROJECT_CREATED', 'DRAFT']
    );
    
    res.json({ id: projectId, message: 'Project created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// 4. Update Project Status (State Machine with Audit Trail)
app.patch('/api/projects/:id/status', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { new_status } = req.body; // DRAFT, UNDER_REVIEW, ACTIVE, COMPLETED
    
    // Check current status
    const projectRes = await db.query('SELECT status FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const previous_status = projectRes.rows[0].status;
    
    // Update the project status
    await db.query('UPDATE projects SET status = $1 WHERE id = $2', [new_status, projectId]);
    
    // Log the change in the audit trail
    await db.query(
      'INSERT INTO audit_logs (project_id, action, previous_state, new_state) VALUES ($1, $2, $3, $4)',
      [projectId, 'STATUS_CHANGE', previous_status, new_status]
    );
    
    res.json({ message: 'Project status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update project status" });
  }
});

// 5. Add Impact Output
app.post('/api/projects/:id/outputs', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { type, title, identifier, impact_score } = req.body;
    
    const outputRes = await db.query(
      'INSERT INTO impact_outputs (project_id, type, title, identifier, impact_score) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [projectId, type, title, identifier, impact_score || 0]
    );
    
    await db.query(
      'INSERT INTO audit_logs (project_id, action, new_state) VALUES ($1, $2, $3)',
      [projectId, 'OUTPUT_ADDED', type]
    );
    
    res.json({ id: outputRes.rows[0].id, message: 'Output added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add output" });
  }
});

// 6. Get Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const logsRes = await db.query(`
      SELECT a.*, p.title as project_title 
      FROM audit_logs a 
      JOIN projects p ON a.project_id = p.id 
      ORDER BY a.timestamp DESC
    `);
    res.json(logsRes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get audit logs" });
  }
});

// 7. Get Departments List
app.get('/api/departments', async (req, res) => {
  try {
    const deptsRes = await db.query('SELECT * FROM departments');
    res.json(deptsRes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get departments" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
