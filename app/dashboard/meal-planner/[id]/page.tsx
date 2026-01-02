'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock data - replace with GraphQL later
const MOCK_MEAL_PLAN = {
  id: '1',
  name: 'Summer Cutting Plan',
  startDate: '2024-12-01',
  endDate: '2024-12-07',
  isActive: true,
  goalCalories: 2200,
  days: [
    {
      date: '2024-12-01',
      dayNumber: 1,
      meals: {
        BREAKFAST: [
          { id: 'r1', name: 'Oatmeal with Protein Powder', calories: 450, protein: 30, carbs: 55, fats: 12 },
        ],
        LUNCH: [
          { id: 'r2', name: 'Grilled Chicken with Rice', calories: 750, protein: 65, carbs: 80, fats: 15 },
        ],
        DINNER: [
          { id: 'r3', name: 'Salmon with Quinoa', calories: 850, protein: 55, carbs: 70, fats: 35 },
        ],
        SNACK: [
          { id: 'r4', name: 'Greek Yogurt', calories: 200, protein: 18, carbs: 15, fats: 8 },
        ],
      },
    },
    {
      date: '2024-12-02',
      dayNumber: 2,
      meals: {
        BREAKFAST: [
          { id: 'r5', name: 'Protein Pancakes', calories: 550, protein: 40, carbs: 60, fats: 14 },
        ],
        LUNCH: [
          { id: 'r6', name: 'Turkey Wrap', calories: 700, protein: 50, carbs: 75, fats: 18 },
        ],
        DINNER: [
          { id: 'r2', name: 'Grilled Chicken with Rice', calories: 750, protein: 65, carbs: 80, fats: 15 },
        ],
        SNACK: [
          { id: 'r4', name: 'Greek Yogurt', calories: 200, protein: 18, carbs: 15, fats: 8 },
        ],
      },
    },
    {
      date: '2024-12-03',
      dayNumber: 3,
      meals: {
        BREAKFAST: [
          { id: 'r1', name: 'Oatmeal with Protein Powder', calories: 450, protein: 30, carbs: 55, fats: 12 },
        ],
        LUNCH: [
          { id: 'r2', name: 'Grilled Chicken with Rice', calories: 750, protein: 65, carbs: 80, fats: 15 },
        ],
        DINNER: [
          { id: 'r3', name: 'Salmon with Quinoa', calories: 850, protein: 55, carbs: 70, fats: 35 },
        ],
        SNACK: [],
      },
    },
  ],
};

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;
type MealType = typeof MEAL_TYPES[number];

interface Recipe {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export default function MealPlanEditorPage() {
  const params = useParams();
  const [selectedDay, setSelectedDay] = useState(0);
  const [mealPlan] = useState(MOCK_MEAL_PLAN);

  const currentDay = mealPlan.days[selectedDay];
  const dayCalories = Object.values(currentDay.meals)
    .flat()
    .reduce((sum, meal) => sum + meal.calories, 0);

  const getMealTypeColor = (type: MealType) => {
    switch (type) {
      case 'BREAKFAST': return 'border-yellow-500 bg-yellow-50';
      case 'LUNCH': return 'border-green-500 bg-green-50';
      case 'DINNER': return 'border-blue-500 bg-blue-50';
      case 'SNACK': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getMealTypeTextColor = (type: MealType) => {
    switch (type) {
      case 'BREAKFAST': return 'text-yellow-700';
      case 'LUNCH': return 'text-green-700';
      case 'DINNER': return 'text-blue-700';
      case 'SNACK': return 'text-purple-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/meal-planner">
            <Button variant="outline" size="sm">
              ← Back to Plans
            </Button>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {mealPlan.name}
              </h1>
              {mealPlan.isActive && (
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-gray-600">
              {new Date(mealPlan.startDate).toLocaleDateString()} - {new Date(mealPlan.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Save Changes</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Publish Plan</Button>
          </div>
        </div>
      </div>

      {/* Day Navigation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {mealPlan.days.map((day, index) => {
              const calories = Object.values(day.meals)
                .flat()
                .reduce((sum, meal) => sum + meal.calories, 0);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(index)}
                  className={`flex-shrink-0 p-4 rounded-lg border-2 transition-all ${
                    selectedDay === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Day {day.dayNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-lg font-bold text-blue-600 mt-2">{calories}</p>
                    <p className="text-xs text-gray-500">kcal</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Overview */}
      <Card className="mb-6 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                Day {currentDay.dayNumber} - {new Date(currentDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Plan your meals for this day
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-blue-600">{dayCalories}</p>
              <p className="text-sm text-gray-600">kcal total</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((dayCalories / mealPlan.goalCalories) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm font-medium text-gray-700">
              {Math.round((dayCalories / mealPlan.goalCalories) * 100)}% of daily goal ({mealPlan.goalCalories} kcal)
            </p>
            <p className="text-sm text-gray-600">
              {dayCalories < mealPlan.goalCalories
                ? `${mealPlan.goalCalories - dayCalories} kcal remaining`
                : `${dayCalories - mealPlan.goalCalories} kcal over`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meal Slots */}
      <div className="space-y-6">
        {MEAL_TYPES.map((mealType) => {
          const meals = currentDay.meals[mealType] || [];
          const mealTypeCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

          return (
            <Card key={mealType} className={`border-l-4 ${getMealTypeColor(mealType)}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className={`text-xl ${getMealTypeTextColor(mealType)}`}>
                      {mealType}
                    </CardTitle>
                    <CardDescription>
                      {meals.length} {meals.length === 1 ? 'recipe' : 'recipes'} • {mealTypeCalories} kcal
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/recipes">
                    <Button size="sm" variant="outline" className="gap-2">
                      + Add Recipe
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {meals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recipes added yet</p>
                    <Link href="/dashboard/recipes">
                      <Button variant="link" className="mt-2">
                        Browse recipes
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{meal.name}</h4>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>{meal.calories} kcal</span>
                            <span>P: {meal.protein}g</span>
                            <span>C: {meal.carbs}g</span>
                            <span>F: {meal.fats}g</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="mt-8 border-2 border-dashed">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage this meal plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">Copy to Next Day</Button>
            <Button variant="outline">Copy to All Days</Button>
            <Button variant="outline">Clear This Day</Button>
            <Link href="/dashboard/recipes">
              <Button variant="outline">Browse All Recipes</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
