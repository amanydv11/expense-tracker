import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbconnect';
import Budget from '@/models/budgetModel';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.amount || !body.category || !body.date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }
    let budget = await Budget.findOne({ category: body.category });
    
    if (!budget) {
      budget = await Budget.create({
        category: body.category,
        amount: 0,
        spent: 0,
        month: new Date(body.date).getMonth(),
        year: new Date(body.date).getFullYear()
      });
    }
    budget.amount += amount;
    await budget.save();

    return NextResponse.json(budget, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 