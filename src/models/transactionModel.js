import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  formattedAmount: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for color based on transaction type
transactionSchema.virtual('color').get(function() {
  return this.type === 'income' ? 'text-green-600' : 'text-red-600';
});

// Method to format amount with sign
transactionSchema.methods.formatAmount = function() {
  return this.type === 'income' ? `+₹${this.amount.toFixed(2)}` : `-₹${this.amount.toFixed(2)}`;
};

// Create indexes for better query performance
transactionSchema.index({ date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ paymentMethod: 1 });

// Virtual for formatted date
transactionSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Method to check if transaction is recent (within last 24 hours)
transactionSchema.methods.isRecent = function() {
  const now = new Date();
  const diff = now - this.date;
  return diff <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
};

// Static method to get transactions by date range
transactionSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to get total amount by category
transactionSchema.statics.getTotalByCategory = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    }
  ]);
};

// Static method to get monthly totals
transactionSchema.statics.getMonthlyTotals = function(year) {
  return this.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$date' },
        total: { $sum: '$amount' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export default Transaction;