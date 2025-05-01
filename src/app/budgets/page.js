'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlusCircle, BarChart2, TrendingUp, Pencil, Trash2, Home, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [transactions, setTransactions] = useState([]);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, categoriesRes, transactionsRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/categories'),
        fetch('/api/transactions')
      ]);

      if (!budgetsRes.ok || !categoriesRes.ok || !transactionsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [budgetsData, categoriesData, transactionsData] = await Promise.all([
        budgetsRes.json(),
        categoriesRes.json(),
        transactionsRes.json()
      ]);

      setBudgets(budgetsData);
      setCategories(categoriesData);
      setTransactions(transactionsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create budget');
      }

      await fetchData();
      setShowForm(false);
      setFormData({
        category: '',
        amount: '',
        period: 'monthly',
        startDate: '',
        endDate: '',
        description: ''
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
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const response = await fetch(`/api/budgets?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete budget');
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };
  const prepareChartData = () => {
    return budgets.map(budget => {
      const actualSpent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: budget.category,
        budget: budget.amount,
        actual: actualSpent,
        difference: budget.amount - actualSpent
      };
    });
  };
  const calculateInsights = () => {
    const insights = [];
    
    budgets.forEach(budget => {
      const actualSpent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = (actualSpent / budget.amount) * 100;
      
      if (percentage > 100) {
        insights.push({
          category: budget.category,
          type: 'warning',
          message: `You've exceeded your ${budget.category} budget by ${(percentage - 100).toFixed(1)}%`
        });
      } else if (percentage > 80) {
        insights.push({
          category: budget.category,
          type: 'alert',
          message: `You're close to exceeding your ${budget.category} budget (${percentage.toFixed(1)}% used)`
        });
      }
    });

    return insights;
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-destructive text-center p-4">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Budget vs Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prepareChartData()}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: 'black',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    color: 'white'
                  }}
                  cursor={{ fill: 'transparent' }}
                />
                <Legend />
                <Bar dataKey="budget" fill="#4ECDC4" name="Budget" />
                <Bar dataKey="actual" fill="#FF6B6B" name="Actual Spending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-background"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category.name}>
                      {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                    </option>
                  ))}
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
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Period</label>
                <select
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-background"
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-background"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-background"
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-background"
                  rows="3"
                />
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                size="lg"
                className="hover:bg-gray-300 hover:text-black cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                type="submit"
                size="lg"
                className="hover:bg-gray-300 hover:text-black cursor-pointer"
              >
                Create Budget
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Spending Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calculateInsights().map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  insight.type === 'warning' ? 'bg-red-50 text-red-700' :
                  insight.type === 'alert' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-green-50 text-green-700'
                }`}
              >
                {insight.type === 'warning' ? (
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                ) : insight.type === 'alert' ? (
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 mt-0.5" />
                )}
                <p className="font-medium">{insight.message}</p>
              </div>
            ))}
            {calculateInsights().length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No insights available yet. Add some budgets and transactions to see insights.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map(budget => (
          <Card key={budget._id} className="bg-muted">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="capitalize">{budget.category}</CardTitle>
                  <CardDescription>{budget.description}</CardDescription>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  budget.status === 'active' ? 'bg-green-100 text-green-800' :
                  budget.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {budget.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold">₹{budget.amount}</p>
              <p className="text-sm text-muted-foreground">
                {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(budget.startDate), 'MMM d, yyyy')} - {format(new Date(budget.endDate), 'MMM d, yyyy')}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="destructive"
                size="lg"
                onClick={() => handleDelete(budget._id)}
                className="bg-destructive hover:bg-red-400 border border-red-400"
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}

        {!showForm && budgets.length > 0 && (
          <Card 
            className="cursor-pointer transition-colors flex justify-center items-center"
            onClick={() => setShowForm(true)}
          >
            <CardContent className="flex flex-col items-center justify-center h-[200px]">
              <PlusCircle className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Add New Budget</p>
            </CardContent>
          </Card>
        )}
      </div>
      {!showForm && budgets.length === 0 && (
        <Card 
          className="text-center p-8 cursor-pointer transition-colors"
          onClick={() => setShowForm(true)}
        >
          <CardContent className="flex flex-col items-center justify-center">
            <PlusCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-xl font-medium text-muted-foreground mb-2">
              No budgets found
            </p>
            <p className="text-muted-foreground">
              Click here to create your first budget
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
