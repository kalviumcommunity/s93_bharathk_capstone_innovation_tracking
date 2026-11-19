const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ImpactOutput = require('../models/ImpactOutput');

// GET /api/analytics/department-summary - Get analytics summary per department
router.get('/department-summary', async (req, res) => {
  try {
    const summary = await Project.aggregate([
      // Lookup department details
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'dept',
        },
      },
      { $unwind: '$dept' },

      // Lookup impact outputs for each project
      {
        $lookup: {
          from: 'impactoutputs',
          localField: 'outputs',
          foreignField: '_id',
          as: 'outputDocs',
        },
      },

      // Group by department
      {
        $group: {
          _id: '$dept._id',
          name: { $first: '$dept.name' },
          total_projects: { $sum: 1 },
          patents: {
            $sum: {
              $size: {
                $filter: {
                  input: '$outputDocs',
                  as: 'o',
                  cond: { $eq: ['$$o.type', 'PATENT'] },
                },
              },
            },
          },
          publications: {
            $sum: {
              $size: {
                $filter: {
                  input: '$outputDocs',
                  as: 'o',
                  cond: { $eq: ['$$o.type', 'PUBLICATION'] },
                },
              },
            },
          },
          tech_transfers: {
            $sum: {
              $size: {
                $filter: {
                  input: '$outputDocs',
                  as: 'o',
                  cond: { $eq: ['$$o.type', 'TECH_TRANSFER'] },
                },
              },
            },
          },
          total_impact_score: {
            $sum: { $sum: '$outputDocs.impactScore' },
          },
        },
      },

      // Sort by department name
      { $sort: { name: 1 } },
    ]);

    res.json(summary);
  } catch (err) {
    console.error('Error fetching department analytics:', err);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

module.exports = router;
