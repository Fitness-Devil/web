'use client';

import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const GET_ACTIVE_MEAL_PLAN = gql`
  query GetMealPlansForNutrition($userId: String!) {
    getMealPlans(userId: $userId) {
      id
      name
      startDate
      endDate
      isActive
    }
  }
`;

const GET_MEAL_PLAN_DETAILS = gql`
  query GetMealPlanDetails($id: String!) {
    getMealPlan(id: $id) {
      id
      name
      startDate
      endDate
      isActive
      avgDailyCalories
      totalCalories
      days {
        id
        date
        totalCalories
        meals {
          id
          mealType
          recipe {
            id
            name
            nutrition {
              calories
              protein
              carbs
              fats
            }
          }
        }
      }
    }
  }
`;

const CALCULATE_CALORIES = gql`
  query CalculateCalories($userId: String) {
    calculateCalories(userId: $userId) {
      basalMetabolicRate
      maintenanceCalories
      goalCalories
    }
  }
`;

interface Meal {
  id: string;
  mealType: string;
  recipe: {
    id: string;
    name: string;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
  };
}

interface Day {
  id: string;
  date: string;
  totalCalories: number;
  meals: Meal[];
}

interface MealPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  avgDailyCalories: number;
  totalCalories: number;
  days: Day[];
}

interface CalorieCalc {
  basalMetabolicRate: number;
  maintenanceCalories: number;
  goalCalories: number;
}

type ViewMode = 'today' | 'weekly';

export default function NutritionDashboard() {
  const { data: session, status } = useSession();
  const [viewMode, setViewMode] = useState<ViewMode>('today');

  // Get user's meal plans
  const { data: mealPlansData, loading: plansLoading } = useQuery<{
    getMealPlans: Array<{ id: string; isActive: boolean }>;
  }>(GET_ACTIVE_MEAL_PLAN, {
    variables: { userId: session?.user?.id },
    skip: !session?.user?.id,
  });

  // Find active meal plan
  const activePlan = mealPlansData?.getMealPlans?.find(p => p.isActive);

  // Get detailed meal plan data
  const { data: mealPlanData, loading: mealPlanLoading, error: mealPlanError } = useQuery<{
    getMealPlan: MealPlan;
  }>(GET_MEAL_PLAN_DETAILS, {
    variables: { id: activePlan?.id },
    skip: !activePlan?.id,
  });

  const { data: calorieData, loading: calorieLoading } = useQuery<{
    calculateCalories: CalorieCalc;
  }>(CALCULATE_CALORIES, {
    variables: {
      userId: session?.user?.id,
    },
    skip: !session?.user?.id,
  });

  const loading = plansLoading || mealPlanLoading || calorieLoading;

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to view your nutrition plan</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your nutrition plan...</p>
        </div>
      </div>
    );
  }

  if (mealPlanError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Error Loading Meal Plan</CardTitle>
            <CardDescription className="text-red-600">
              {mealPlanError.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const mealPlan = mealPlanData?.getMealPlan;
  const calorieInfo = calorieData?.calculateCalories;

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Find today's day or use first 7 days for weekly view
  const todaysDay = mealPlan?.days?.find(d => d.date === today);
  const weekDays = mealPlan?.days?.slice(0, 7) || [];

  const todaysMeals = todaysDay?.meals || [];
  const totalCalories = todaysDay?.totalCalories || 0;
  const weeklyAvgCalories = mealPlan?.avgDailyCalories || 0;

  // Group meals by type (for today view)
  const mealsByType = todaysMeals.reduce((acc, meal) => {
    const type = meal.mealType || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(meal);
    return acc;
  }, {} as Record<string, Meal[]>);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with View Toggle */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Nutrition Dashboard
            </h1>
            <p className="text-gray-600">Your personalized meal plan and calorie tracking</p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('today')}
              className={`px-6 py-2.5 rounded-md font-medium transition-all duration-200 ${
                viewMode === 'today'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-6 py-2.5 rounded-md font-medium transition-all duration-200 ${
                viewMode === 'weekly'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>
      </div>

      {/* Calorie Summary Cards */}
      {calorieInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Basal Metabolic Rate</CardTitle>
              <CardDescription>Calories burned at rest</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{Math.round(calorieInfo.basalMetabolicRate)}</p>
              <p className="text-sm text-gray-600 mt-1">kcal/day</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Maintenance Calories</CardTitle>
              <CardDescription>To maintain current weight</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">{Math.round(calorieInfo.maintenanceCalories)}</p>
              <p className="text-sm text-gray-600 mt-1">kcal/day</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Goal Calories</CardTitle>
              <CardDescription>Based on your fitness goal</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-indigo-600">{Math.round(calorieInfo.goalCalories)}</p>
              <p className="text-sm text-gray-600 mt-1">kcal/day</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calorie Total Card */}
      <Card className="mb-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="text-2xl">
            {viewMode === 'today' ? "Today's Total" : 'Weekly Average'}
          </CardTitle>
          <CardDescription className="text-base">
            {viewMode === 'today'
              ? 'Total calories from your meal plan today'
              : 'Average daily calories this week'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3">
            <p className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {viewMode === 'today' ? totalCalories : weeklyAvgCalories}
            </p>
            <p className="text-2xl text-gray-600">kcal</p>
          </div>
          {calorieInfo && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${Math.min(((viewMode === 'today' ? totalCalories : weeklyAvgCalories) / calorieInfo.goalCalories) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm font-medium text-gray-700">
                  {Math.round(((viewMode === 'today' ? totalCalories : weeklyAvgCalories) / calorieInfo.goalCalories) * 100)}% of daily goal
                </p>
                <p className="text-sm text-gray-600">
                  {(viewMode === 'today' ? totalCalories : weeklyAvgCalories) < calorieInfo.goalCalories
                    ? `${calorieInfo.goalCalories - (viewMode === 'today' ? totalCalories : weeklyAvgCalories)} kcal remaining`
                    : `${(viewMode === 'today' ? totalCalories : weeklyAvgCalories) - calorieInfo.goalCalories} kcal over`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meals Section */}
      <div className="space-y-6">
        {viewMode === 'today' ? (
          /* Today's View */
          <>
            <h2 className="text-3xl font-bold">
              Today&apos;s Meals
            </h2>

            {!mealPlan ? (
              <Card className="border-2 border-dashed">
                <CardHeader>
                  <CardTitle>No Active Meal Plan</CardTitle>
                  <CardDescription>
                    You don&apos;t have an active meal plan. Create one in the Meal Planner to see your nutrition data here.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : todaysMeals.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardHeader>
                  <CardTitle>No Meals Planned for Today</CardTitle>
                  <CardDescription>
                    Add meals to today in your meal plan to see them here.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              Object.entries(mealsByType).map(([type, typeMeals]) => (
                <div key={type} className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-700 capitalize flex items-center gap-2">
                    <span className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
                    {type}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeMeals.map((meal) => (
                      <Card key={meal.id} className="hover:shadow-xl hover:scale-105 transition-all duration-200 border-l-4 border-l-blue-500">
                        <CardHeader>
                          <CardTitle className="text-lg leading-tight">
                            {meal.recipe.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {meal.recipe.nutrition.calories}
                              </p>
                              <p className="text-sm text-gray-600 font-medium">kcal</p>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-xs">
                              <div className="text-center">
                                <p className="font-bold text-green-600">{meal.recipe.nutrition.protein}g</p>
                                <p className="text-gray-500">Protein</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-blue-600">{meal.recipe.nutrition.carbs}g</p>
                                <p className="text-gray-500">Carbs</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-orange-600">{meal.recipe.nutrition.fats}g</p>
                                <p className="text-gray-500">Fats</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          /* Weekly View */
          <>
            <h2 className="text-3xl font-bold">
              Weekly Meal Plan
            </h2>

            {!mealPlan ? (
              <Card className="border-2 border-dashed">
                <CardHeader>
                  <CardTitle>No Active Meal Plan</CardTitle>
                  <CardDescription>
                    You don&apos;t have an active meal plan. Create one in the Meal Planner to see your nutrition data here.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-8">
                {weekDays.map((day, dayIndex) => {
                  const mealsByTypeForDay = day.meals.reduce((acc, meal) => {
                    const type = meal.mealType || 'Other';
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(meal);
                    return acc;
                  }, {} as Record<string, Meal[]>);

                  const dayDate = new Date(day.date);
                  const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });

                  return (
                    <Card key={day.id} className="overflow-hidden border-2 hover:border-blue-300 transition-colors">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-2xl">{dayName}</CardTitle>
                            <CardDescription>{dayDate.toLocaleDateString()}</CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-blue-600">{day.totalCalories}</p>
                            <p className="text-sm text-gray-600">kcal total</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {day.meals.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No meals planned for this day</p>
                        ) : (
                          <div className="space-y-6">
                            {Object.entries(mealsByTypeForDay).map(([type, typeMeals]) => (
                              <div key={type}>
                                <h4 className="text-md font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                                  <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                                  {type}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {typeMeals.map((meal) => (
                                    <div
                                      key={meal.id}
                                      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all"
                                    >
                                      <p className="font-medium text-gray-900 mb-2 leading-tight">{meal.recipe.name}</p>
                                      <p className="text-2xl font-bold text-blue-600">
                                        {meal.recipe.nutrition.calories} <span className="text-sm text-gray-600">kcal</span>
                                      </p>
                                      <div className="grid grid-cols-3 gap-1 text-xs mt-2">
                                        <div>
                                          <p className="font-bold text-green-600">{meal.recipe.nutrition.protein}g</p>
                                          <p className="text-gray-500">P</p>
                                        </div>
                                        <div>
                                          <p className="font-bold text-blue-600">{meal.recipe.nutrition.carbs}g</p>
                                          <p className="text-gray-500">C</p>
                                        </div>
                                        <div>
                                          <p className="font-bold text-orange-600">{meal.recipe.nutrition.fats}g</p>
                                          <p className="text-gray-500">F</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
