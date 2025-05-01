import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbconnect';
import mongoose from 'mongoose';


const DEFAULT_CATEGORIES = [
  { name: 'food', icon: '🍔', color: '#FF6B6B' },
  { name: 'transportation', icon: '🚗', color: '#4ECDC4' },
  { name: 'shopping', icon: '🛍️', color: '#FFD93D' },
  { name: 'entertainment', icon: '🎬', color: '#95E1D3' },
  { name: 'other', icon: '📦', color: '#6C5CE7' }
];


const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});


const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);


async function initializeCategories() {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log('Default categories initialized');
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
}


export async function GET() {
  try {
    await connectDB();
    await initializeCategories();
    
    const categories = await Category.find().sort({ name: 1 });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

  
    if (!body.name || !body.icon || !body.color) {
      return NextResponse.json(
        { error: 'Name, icon, and color are required' },
        { status: 400 }
      );
    }


    const existingCategory = await Category.findOne({ name: body.name });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      );
    }

    const category = await Category.create(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}


export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}


export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

  
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const isDefaultCategory = DEFAULT_CATEGORIES.some(
      defaultCat => defaultCat.name === category.name
    );

    if (isDefaultCategory) {
      return NextResponse.json(
        { error: 'Cannot delete default category' },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
