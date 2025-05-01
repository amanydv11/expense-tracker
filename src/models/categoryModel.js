import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: 'default-icon'
  },
  color: {
    type: String,
    default: '#000000'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add index for faster queries
categorySchema.index({ name: 1 });

// Pre-save middleware to ensure name is lowercase
categorySchema.pre('save', function(next) {
  this.name = this.name.toLowerCase();
  next();
});

// Static method to get default categories
categorySchema.statics.getDefaultCategories = function() {
  return [
    {
      name: 'food',
      description: 'Food and dining expenses',
      icon: 'utensils',
      color: '#FF6B6B',
      isDefault: true
    },
    {
      name: 'transportation',
      description: 'Transportation and travel expenses',
      icon: 'car',
      color: '#4ECDC4',
      isDefault: true
    },
    {
      name: 'shopping',
      description: 'Shopping and retail expenses',
      icon: 'shopping-cart',
      color: '#FFD93D',
      isDefault: true
    },
    {
      name: 'entertainment',
      description: 'Entertainment and leisure expenses',
      icon: 'film',
      color: '#95E1D3',
      isDefault: true
    },
    {
      name: 'other',
      description: 'Other miscellaneous expenses',
      icon: 'ellipsis-h',
      color: '#6C5CE7',
      isDefault: true
    }
  ];
};

// Method to check if category is in use
categorySchema.methods.isInUse = async function() {
  const Transaction = mongoose.model('Transaction');
  const count = await Transaction.countDocuments({ category: this.name });
  return count > 0;
};

// Virtual for formatted name
categorySchema.virtual('formattedName').get(function() {
  return this.name.charAt(0).toUpperCase() + this.name.slice(1);
});

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category;
