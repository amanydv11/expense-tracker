import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

budgetSchema.index({ category: 1 });
budgetSchema.index({ startDate: -1 });
budgetSchema.index({ status: 1 });

budgetSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
});

budgetSchema.methods.isExceeded = async function(actualAmount) {
  return actualAmount > this.amount;
};

budgetSchema.statics.getActiveBudgets = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

export default Budget;
