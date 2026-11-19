const express = require('express');
const router = express.Router();
const Innovator = require('../models/Innovator');

// GET /api/innovators - Get all innovators with populated department info
router.get('/', async (req, res) => {
  try {
    const innovators = await Innovator.find()
      .populate('department', 'name code')
      .sort({ name: 1 });
    res.json(innovators);
  } catch (err) {
    console.error('Error fetching innovators:', err);
    res.status(500).json({ error: 'Failed to get innovators' });
  }
});

// GET /api/innovators/:id - Get a single innovator by ID
router.get('/:id', async (req, res) => {
  try {
    const innovator = await Innovator.findById(req.params.id)
      .populate('department', 'name code');
    if (!innovator) {
      return res.status(404).json({ error: 'Innovator not found' });
    }
    res.json(innovator);
  } catch (err) {
    console.error('Error fetching innovator:', err);
    res.status(500).json({ error: 'Failed to get innovator' });
  }
});

module.exports = router;
