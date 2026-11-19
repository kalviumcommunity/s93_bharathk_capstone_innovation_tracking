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

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const { title, description, department, status } = req.body;
    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, department, status } },
      { new: true, runValidators: true }
    ).populate('department', 'name code');
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project updated successfully', project: updated });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    await ImpactOutput.deleteMany({ project: req.params.id });
    res.json({ message: 'Project deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
