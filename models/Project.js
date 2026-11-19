const mongoose = require('mongoose');

const projectInnovatorSchema = new mongoose.Schema({
  innovator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Innovator',
    required: true,
  },
  role: {
    type: String,
    required: [true, 'Innovator role is required'],
    trim: true,
  },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department reference is required'],
  },
  status: {
    type: String,
    enum: {
      values: ['DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'COMPLETED'],
      message: '{VALUE} is not a valid project status',
    },
    default: 'DRAFT',
  },
  innovators: [projectInnovatorSchema],
  outputs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImpactOutput',
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Project', projectSchema);
