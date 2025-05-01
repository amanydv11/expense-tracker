import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbconnect';
import Budget from '@/models/budgetModel';
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const period = searchParams.get('period');
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (period) query.period = period;

    const budgets = await Budget.find(query)
      .sort({ startDate: -1 })
      .lean();

    return NextResponse.json(budgets);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.category || !body.amount || !body.period || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Category, amount, period, startDate, and endDate are required' },
        { status: 400 }
      );
    }
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }
    const overlappingBudget = await Budget.findOne({
      category: body.category,
      status: 'active',
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      ]
    });

    if (overlappingBudget) {
      return NextResponse.json(
        { error: 'An active budget already exists for this category in the specified date range' },
        { status: 400 }
      );
    }

    const budget = await Budget.create(body);
    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create budget' },
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
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }
    if (body.startDate && body.endDate) {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        );
      }
    }

    const budget = await Budget.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(budget);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update budget' },
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
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    const budget = await Budget.findByIdAndDelete(id);
    
    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}
