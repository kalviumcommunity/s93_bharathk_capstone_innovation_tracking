const mongoose = require('mongoose');

const innovatorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Innovator name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department reference is required'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Innovator', innovatorSchema);
