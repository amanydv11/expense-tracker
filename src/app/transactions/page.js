'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PlusCircle, ArrowUpRight, ArrowDownRight, Pencil, Wallet, TrendingUp, TrendingDown, LayoutDashboard, PiggyBank } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsRes, categoriesRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/categories')
      ]);

      if (!transactionsRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [transactionsData, categoriesData] = await Promise.all([
        transactionsRes.json(),
        categoriesRes.json()
      ]);

      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingTransaction 
        ? `/api/transactions?id=${editingTransaction._id}`
        : '/api/transactions';
      
      const requestBody = editingTransaction 
        ? { ...formData, id: editingTransaction._id }
        : formData;
      
      const response = await fetch(url, {
        method: editingTransaction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${editingTransaction ? 'update' : 'create'} transaction`);
      }
      if (!editingTransaction && formData.type === 'income') {
        const budgetResponse = await fetch('/api/budgets/income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: formData.amount,
            category: formData.category,
            date: formData.date
          })
        });

        if (!budgetResponse.ok) {
          console.error('Failed to update budget with income');
        }
      }

      await fetchData();
      setShowForm(false);
      setEditingTransaction(null);
      setFormData({
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (err) {
      setError(err.message);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      date: format(new Date(transaction.date), 'yyyy-MM-dd')
    });
    setShowForm(true);
  };
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete transaction');
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };
  const handleCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
    setFormData({
      amount: '',
      type: 'expense',
      category: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };
  const formatAmountPreview = () => {
    if (!formData.amount) return '';
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return '';
    return formData.type === 'income' 
      ? `+₹${amount.toFixed(2)}`
      : `-₹${amount.toFixed(2)}`;
  };
  const prepareMonthlyChartData = () => {
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const date = new Date(transaction.date);
        const monthKey = format(date, 'MMM yyyy');
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            amount: 0
          };
        }
        
        monthlyData[monthKey].amount += transaction.amount;
      }
    });

    return Object.values(monthlyData)
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .map(item => ({
        ...item,
        amount: parseFloat(item.amount.toFixed(2))
      }));
  };
  const barColors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEEAD', // Yellow
    '#D4A5A5', // Pink
    '#9B59B6', // Purple
    '#3498DB', // Light Blue
    '#E67E22', // Orange
    '#2ECC71', // Emerald
    '#F1C40F', // Yellow
    '#1ABC9C'  // Turquoise
  ];

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-destructive text-center p-4">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-5xl font-bold flex justify-center items-center font-serif text-green-500 ">Expense-Tracker</h1>
      <div className="flex justify-between items-center mt-2 mb-8">
        <div className="gap-4">
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="flex items-center gap-2 hover:bg-gray-300 hover:text-black cursor-pointer">
                <LayoutDashboard className="w-5 h-5" />
               My Dashboard
              </Button>
            </Link>
            <Link href="/budgets">
              <Button variant="outline" size="lg" className="flex items-center gap-2 hover:bg-gray-300 hover:text-black cursor-pointer">
                <PiggyBank className="w-5 h-5" />
                Create Budget
              </Button>
            </Link>
          </div>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            size="lg"
            className="flex items-center gap-2 hover:bg-gray-300 hover:text-black cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            Add Transaction
          </Button>
        )}
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Monthly Expenses</CardTitle>
          <CardDescription>Track your spending patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="80%" height="100%">
              <BarChart
                data={prepareMonthlyChartData()}
                margin={{
                  top: 20,
                  right: 50,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  stroke="#6B7280"
                />
                <YAxis 
                  tickFormatter={(value) => `₹${value}`}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  stroke="#6B7280"
                />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, 'Amount']}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{
                    backgroundColor: 'black',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                >
                  {prepareMonthlyChartData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={barColors[index % barColors.length]}
                      stroke="none"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
            <DialogDescription>
              {editingTransaction ? 'Update your transaction details' : 'Record your income or expense'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-background"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-background"
                  min="0"
                  step="0.01"
                  required
                />
                {formData.amount && (
                  <div className={`mt-2 p-3 rounded-md ${
                    formData.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <p className={`text-lg font-semibold ${
                      formData.type === 'income' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formatAmountPreview()}
                    </p>
                    <p className="text-sm ">
                      {formData.type === 'income' ? 'This amount will be added to your income' : 'This amount will be deducted from your balance'}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option className='text-black' value="">Select a category</option>
                  {categories.map(category => (
                    <option className='bg-black text-white'  key={category._id} value={category.name}>
                      {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md "
                  rows="3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                size="lg"
                className=" cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                className="border cursor-pointer"
              >
                {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="space-y-4">
        {transactions.map(transaction => (
          <Card 
            key={transaction._id} 
            className={`${
              transaction.type === 'income' 
                ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <h3 className="font-medium capitalize text-foreground">{transaction.category}</h3>
                  </div>
                  <p className="text-sm ">{transaction.description}</p>
                  <p className="text-sm ">₹{transaction.amount}</p>
                  <p className="text-sm">
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`text-xl font-bold ${
                    transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.formattedAmount}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(transaction)}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(transaction._id)}
                      className="flex items-center gap-1 hover:bg-red-500 cursor-pointer"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {transactions.length === 0 && (
        <Card className="text-center p-8 ">
          <CardContent className="flex flex-col items-center justify-center">
            <PlusCircle className="w-16 h-16  mb-4" />
            <p className="text-xl font-medium  mb-2">
              No transactions found
            </p>
            <p>
              Click Add Transaction to record your first transaction
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
