import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['food', 'transportation', 'shopping', 'entertainment', 'other'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  period: {
    type: String,
    required: [true, 'Period is required'],
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  }
}, {
  timestamps: true,
});

// Create indexes for better query performance
budgetSchema.index({ category: 1 });
budgetSchema.index({ startDate: -1 });
budgetSchema.index({ status: 1 });

// Virtual for checking if budget is active
budgetSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
});

// Method to check if budget is exceeded
budgetSchema.methods.isExceeded = async function(actualAmount) {
  return actualAmount > this.amount;
};

// Static method to get active budgets
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
