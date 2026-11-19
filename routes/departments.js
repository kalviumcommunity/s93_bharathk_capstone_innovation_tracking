const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// GET /api/departments - Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to get departments' });
  }
});

// GET /api/departments/:id - Get a single department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(department);
  } catch (err) {
    console.error('Error fetching department:', err);
    res.status(500).json({ error: 'Failed to get department' });
  }
});

module.exports = router;
