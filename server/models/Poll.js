const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  count: { type: Number, default: 0 }
});

const ResponseSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  name: { type: String, required: true },
  optionIndex: Number,
  submittedAt: { type: Date, default: Date.now }
}, { _id: false });

const PollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [OptionSchema], validate: v => v.length >= 2 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  createdBy: { type: String, default: 'Teacher' },
  responses: { type: [ResponseSchema], default: [] } // 👈 we’ll use this as participants too
}, { timestamps: true });

module.exports = mongoose.model('Poll', PollSchema);
