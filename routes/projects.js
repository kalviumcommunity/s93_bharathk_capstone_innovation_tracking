const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ImpactOutput = require('../models/ImpactOutput');

// GET /api/projects - Get all projects with populated department, innovators, and outputs
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('department', 'name code')
      .populate('innovators.innovator', 'name email')
      .populate('outputs')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// GET /api/projects/:id - Get a single project by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('department', 'name code')
      .populate('innovators.innovator', 'name email')
      .populate('outputs');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// GET /api/projects/:id/outputs - Get all impact outputs for a specific project
router.get('/:id/outputs', async (req, res) => {
  try {
    const outputs = await ImpactOutput.find({ project: req.params.id })
      .sort({ createdAt: -1 });
    res.json(outputs);
  } catch (err) {
    console.error('Error fetching project outputs:', err);
    res.status(500).json({ error: 'Failed to get project outputs' });
  }
});

module.exports = router;
