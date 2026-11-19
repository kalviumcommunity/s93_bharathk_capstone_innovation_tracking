const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

// GET /api/audit-logs - Get all audit logs with populated project title
router.get('/', async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('project', 'title')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

// GET /api/audit-logs/:projectId - Get audit logs for a specific project
router.get('/:projectId', async (req, res) => {
  try {
    const logs = await AuditLog.find({ project: req.params.projectId })
      .populate('project', 'title')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs for project:', err);
    res.status(500).json({ error: 'Failed to get audit logs for project' });
  }
});

module.exports = router;
