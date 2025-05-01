import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbconnect';
import Transaction from '@/models/transactionModel';


export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit')) || 100;
    const summary = searchParams.get('summary');


    if (summary === 'true') {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: 'Start date and end date are required for summary' },
          { status: 400 }
        );
      }

      const summaryData = await Transaction.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $group: {
            _id: {
              category: '$category',
              type: '$type'
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.type',
            categories: {
              $push: {
                category: '$_id.category',
                total: '$total',
                count: '$count'
              }
            },
            totalAmount: { $sum: '$total' }
          }
        }
      ]);

      return NextResponse.json(summaryData);
    }


    const query = {};
    if (category) query.category = category;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit);

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();


    if (!body.amount || !body.description || !body.category || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['income', 'expense'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid transaction type. Must be either income or expense' },
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


    const transaction = await Transaction.create({
      ...body,
      amount,
      date: body.date || new Date(),
      formattedAmount: body.type === 'income' ? `+₹${amount.toFixed(2)}` : `-₹${amount.toFixed(2)}`
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

 
    if (body.amount) {
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be a positive number' },
          { status: 400 }
        );
      }
      body.formattedAmount = body.type === 'income' ? `+₹${amount.toFixed(2)}` : `-₹${amount.toFixed(2)}`;
    }

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transaction = await Transaction.findByIdAndDelete(id);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
