const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required'],
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
  },
  previousState: {
    type: String,
    trim: true,
  },
  newState: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false,
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
