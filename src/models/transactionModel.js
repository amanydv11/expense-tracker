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


transactionSchema.virtual('color').get(function() {
  return this.type === 'income' ? 'text-green-600' : 'text-red-600';
});


transactionSchema.methods.formatAmount = function() {
  return this.type === 'income' ? `+₹${this.amount.toFixed(2)}` : `-₹${this.amount.toFixed(2)}`;
};


transactionSchema.index({ date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ paymentMethod: 1 });


transactionSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});


transactionSchema.methods.isRecent = function() {
  const now = new Date();
  const diff = now - this.date;
  return diff <= 24 * 60 * 60 * 1000; 
};


transactionSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};


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