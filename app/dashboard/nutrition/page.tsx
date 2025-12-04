'use client';

import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const GET_DAILY_NUTRITION_PLAN = gql`
  query GetDailyNutritionPlan($days: Int, $userId: String) {
    getDailyNutritionPlan(days: $days, userId: $userId) {
      userId
      meals {
        name
        type
        calories
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
  name: string;
  type: string;
  calories: number;
}

interface NutritionPlan {
  userId: string;
  meals: Meal[];
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

  // Debug: Log session info
  console.log('Session:', session);
  console.log('Session status:', status);
  console.log('User ID:', session?.user?.id);

  const { data: nutritionData, loading: nutritionLoading, error: nutritionError } = useQuery<{
    getDailyNutritionPlan: NutritionPlan;
  }>(GET_DAILY_NUTRITION_PLAN, {
    variables: {
      days: viewMode === 'today' ? 1 : 7,
      userId: session?.user?.id,
    },
    skip: !session?.user?.id,
  });

  const { data: calorieData, loading: calorieLoading } = useQuery<{
    calculateCalories: CalorieCalc;
  }>(CALCULATE_CALORIES, {
    variables: {
      userId: session?.user?.id,
    },
    skip: !session?.user?.id,
  });

  // Log errors for debugging
  if (nutritionError) {
    console.error('Nutrition Error:', nutritionError);
    console.error('Full error object:', JSON.stringify(nutritionError, null, 2));
  }

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

  if (nutritionLoading || calorieLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your nutrition plan...</p>
        </div>
      </div>
    );
  }

  if (nutritionError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Error Loading Nutrition Plan</CardTitle>
            <CardDescription className="text-red-600 space-y-2">
              <p className="font-semibold">{nutritionError.message}</p>
              <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-gray-700">
                <p><strong>Debug Info:</strong></p>
                <p>GraphQL URL: {process.env.NEXT_PUBLIC_GRAPHQL_URL}</p>
                <p>User ID: {session?.user?.id || 'Not available'}</p>
                <p>User Email: {session?.user?.email || 'Not available'}</p>
                <p className="mt-2"><strong>Possible causes:</strong></p>
                <ul className="list-disc ml-4 mt-1">
                  <li>Backend server is not running (check port 8080)</li>
                  <li>CORS configuration issue</li>
                  <li>Authentication token issue</li>
                  <li>Network connectivity problem</li>
                </ul>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const allMeals = nutritionData?.getDailyNutritionPlan?.meals || [];
  const calorieInfo = calorieData?.calculateCalories;

  // Calculate meals per day
  const mealsPerDay = viewMode === 'weekly' ? Math.ceil(allMeals.length / 7) : allMeals.length;
  const todaysMeals = viewMode === 'today' ? allMeals : allMeals.slice(0, mealsPerDay);

  // Group weekly meals by day
  const weeklyMeals = viewMode === 'weekly' ? Array.from({ length: 7 }, (_, dayIndex) => {
    const startIndex = dayIndex * mealsPerDay;
    const endIndex = startIndex + mealsPerDay;
    return allMeals.slice(startIndex, endIndex);
  }) : [];

  const totalCalories = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const weeklyAvgCalories = viewMode === 'weekly' ? Math.round(allMeals.reduce((sum, m) => sum + m.calories, 0) / 7) : 0;

  // Group meals by type (for today view)
  const mealsByType = todaysMeals.reduce((acc, meal) => {
    const type = meal.type || 'Other';
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

            {todaysMeals.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardHeader>
                  <CardTitle>No Meals Planned</CardTitle>
                  <CardDescription>
                    You don&apos;t have any meals planned for today. Contact your nutritionist or set up your nutrition profile.
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
                    {typeMeals.map((meal, index) => (
                      <Card key={`${type}-${index}`} className="hover:shadow-xl hover:scale-105 transition-all duration-200 border-l-4 border-l-blue-500">
                        <CardHeader>
                          <CardTitle className="text-lg leading-tight">
                            {meal.name || 'Unnamed Meal'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {meal.calories}
                            </p>
                            <p className="text-sm text-gray-600 font-medium">kcal</p>
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

            <div className="space-y-8">
              {weeklyMeals.map((dayMeals, dayIndex) => {
                const dayCalories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
                const mealsByTypeForDay = dayMeals.reduce((acc, meal) => {
                  const type = meal.type || 'Other';
                  if (!acc[type]) acc[type] = [];
                  acc[type].push(meal);
                  return acc;
                }, {} as Record<string, Meal[]>);

                return (
                  <Card key={dayIndex} className="overflow-hidden border-2 hover:border-blue-300 transition-colors">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl">
                          {dayNames[dayIndex]}
                        </CardTitle>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-blue-600">{dayCalories}</p>
                          <p className="text-sm text-gray-600">kcal total</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        {Object.entries(mealsByTypeForDay).map(([type, typeMeals]) => (
                          <div key={type}>
                            <h4 className="text-md font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                              {type}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {typeMeals.map((meal, mealIndex) => (
                                <div
                                  key={mealIndex}
                                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all"
                                >
                                  <p className="font-medium text-gray-900 mb-2 leading-tight">{meal.name}</p>
                                  <p className="text-2xl font-bold text-blue-600">{meal.calories} <span className="text-sm text-gray-600">kcal</span></p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
