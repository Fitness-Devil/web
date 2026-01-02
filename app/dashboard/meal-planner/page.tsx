'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock data - replace with GraphQL later
const MOCK_MEAL_PLANS = [
  {
    id: '1',
    name: 'Summer Cutting Plan',
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    isActive: true,
    avgDailyCalories: 2200,
    totalDays: 31,
  },
  {
    id: '2',
    name: 'Bulk Up December',
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    isActive: false,
    avgDailyCalories: 3200,
    totalDays: 30,
  },
  {
    id: '3',
    name: 'Maintenance Week',
    startDate: '2024-10-15',
    endDate: '2024-10-21',
    isActive: false,
    avgDailyCalories: 2500,
    totalDays: 7,
  },
];

export default function MealPlannerPage() {
  const [mealPlans] = useState(MOCK_MEAL_PLANS);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Meal Planner
            </h1>
            <p className="text-gray-600">Create and manage your custom meal plans</p>
          </div>
          <Link href="/dashboard/meal-planner/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Create New Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Plan */}
      {mealPlans.filter(p => p.isActive).map((plan) => (
        <Card key={plan.id} className="mb-8 border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    ACTIVE
                  </span>
                </div>
                <CardDescription className="text-base">
                  {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Duration</p>
                <p className="text-2xl font-bold text-blue-600">{plan.totalDays} days</p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Avg Daily Calories</p>
                <p className="text-2xl font-bold text-blue-600">{plan.avgDailyCalories} kcal</p>
              </div>
              <div className="p-4 bg-white rounded-lg flex items-center justify-center">
                <Link href={`/dashboard/meal-planner/${plan.id}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    View & Edit Plan
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Past Plans */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4">Past Meal Plans</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mealPlans.filter(p => !p.isActive).map((plan) => (
          <Card key={plan.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>
                {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{plan.totalDays} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Calories:</span>
                  <span className="font-medium">{plan.avgDailyCalories} kcal</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/meal-planner/${plan.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      View
                    </Button>
                  </Link>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" size="sm">
                    Duplicate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mealPlans.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle>No Meal Plans Yet</CardTitle>
            <CardDescription>
              Create your first meal plan to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/meal-planner/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Create Your First Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
