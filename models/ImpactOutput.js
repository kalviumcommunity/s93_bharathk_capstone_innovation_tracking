const mongoose = require('mongoose');

const impactOutputSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required'],
  },
  type: {
    type: String,
    enum: {
      values: ['PATENT', 'PUBLICATION', 'TECH_TRANSFER'],
      message: '{VALUE} is not a valid output type',
    },
    required: [true, 'Output type is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  identifier: {
    type: String,
    trim: true,
  },
  impactScore: {
    type: Number,
    default: 0,
    min: [0, 'Impact score cannot be negative'],
  },
  grantedDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: {
      values: ['PENDING', 'VERIFIED'],
      message: '{VALUE} is not a valid output status',
    },
    default: 'PENDING',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ImpactOutput', impactOutputSchema);
