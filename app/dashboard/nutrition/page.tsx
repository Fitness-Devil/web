'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/rest-client';

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
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [calorieInfo, setCalorieInfo] = useState<CalorieCalc | null>(null);
  const [loading, setLoading] = useState(true);
  const [mealPlanError, setMealPlanError] = useState<Error | null>(null);

  useEffect(() => {
    const loadNutrition = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [plans, calories] = await Promise.all([
          apiFetch<Array<{ id: string; isActive: boolean }>>(`/meal-plans/user/${session.user.id}`),
          apiFetch<CalorieCalc>(`/nutrition/calories/${session.user.id}`),
        ]);

        const activePlan = plans?.find(p => p.isActive);
        if (activePlan?.id) {
          const planDetails = await apiFetch<MealPlan>(`/meal-plans/${activePlan.id}`);
          setMealPlan(planDetails);
        } else {
          setMealPlan(null);
        }

        setCalorieInfo(calories);
        setMealPlanError(null);
      } catch (fetchError) {
        setMealPlanError(fetchError as Error);
      } finally {
        setLoading(false);
      }
    };

    loadNutrition();
  }, [session?.user?.id]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Authentication Required</CardTitle>
            <CardDescription>Please sign in to view your nutrition plan</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-primary"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading your nutrition plan...</p>
        </div>
      </div>
    );
  }

  if (mealPlanError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Error Loading Meal Plan</CardTitle>
            <CardDescription className="text-destructive">
              {mealPlanError.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
    <div className="mx-auto w-full max-w-6xl space-y-10">
      {/* Header with View Toggle */}
      <div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Nutrition</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Nutrition Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your personalized meal plan and calorie tracking.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setViewMode('today')}
              className={`rounded-full px-6 py-2 text-sm font-medium transition ${
                viewMode === 'today'
                  ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(248,113,113,0.4)]'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`rounded-full px-6 py-2 text-sm font-medium transition ${
                viewMode === 'weekly'
                  ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(248,113,113,0.4)]'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>
      </div>

      {/* Calorie Summary Cards */}
      {calorieInfo && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              title: 'Basal Metabolic Rate',
              description: 'Calories burned at rest',
              value: Math.round(calorieInfo.basalMetabolicRate),
            },
            {
              title: 'Maintenance Calories',
              description: 'To maintain current weight',
              value: Math.round(calorieInfo.maintenanceCalories),
            },
            {
              title: 'Goal Calories',
              description: 'Based on your fitness goal',
              value: Math.round(calorieInfo.goalCalories),
            },
          ].map((card) => (
            <Card key={card.title} className="border-white/10 bg-card/70">
              <CardHeader>
                <CardTitle className="text-base text-white">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-white">{card.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  kcal/day
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Calorie Total Card */}
      <Card className="border-white/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-2xl text-white">
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
            <p className="text-5xl font-semibold text-primary sm:text-6xl">
              {viewMode === 'today' ? totalCalories : weeklyAvgCalories}
            </p>
            <p className="text-lg text-muted-foreground">kcal</p>
          </div>
          {calorieInfo && (
            <div className="mt-6">
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(((viewMode === 'today' ? totalCalories : weeklyAvgCalories) / calorieInfo.goalCalories) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">
                  {Math.round(((viewMode === 'today' ? totalCalories : weeklyAvgCalories) / calorieInfo.goalCalories) * 100)}% of daily goal
                </p>
                <p className="text-sm text-muted-foreground">
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
            <h2 className="text-2xl font-semibold text-white">
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
                <div key={type} className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="h-6 w-1 rounded-full bg-gradient-to-b from-primary to-orange-400"></span>
                    {type}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {typeMeals.map((meal) => (
                      <Card
                        key={meal.id}
                        className="border-white/10 bg-card/70 transition hover:border-primary/40 hover:bg-card/90"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold text-white">
                            {meal.recipe.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-2xl font-semibold text-primary">
                                {meal.recipe.nutrition.calories}
                              </p>
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                kcal
                              </p>
                            </div>
                            <div className="flex gap-3 text-right text-xs text-muted-foreground">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {meal.recipe.nutrition.protein}g
                                </p>
                                <p>Protein</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {meal.recipe.nutrition.carbs}g
                                </p>
                                <p>Carbs</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {meal.recipe.nutrition.fats}g
                                </p>
                                <p>Fats</p>
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
            <h2 className="text-2xl font-semibold text-white">
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
                    <Card key={day.id} className="overflow-hidden border-white/10 bg-card/80">
                      <CardHeader className="border-b border-white/10">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <CardTitle className="text-xl text-white">{dayName}</CardTitle>
                            <CardDescription>{dayDate.toLocaleDateString()}</CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-semibold text-primary">{day.totalCalories}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                              kcal total
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-5">
                        {day.meals.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No meals planned for this day</p>
                        ) : (
                          <div className="space-y-5">
                            {Object.entries(mealsByTypeForDay).map(([type, typeMeals]) => (
                              <div key={type}>
                                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                  <span className="h-5 w-1 rounded-full bg-primary"></span>
                                  {type}
                                </h4>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                  {typeMeals.map((meal) => (
                                    <div
                                      key={meal.id}
                                      className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-primary/40"
                                    >
                                      <p className="text-sm font-semibold text-white">{meal.recipe.name}</p>
                                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="text-lg font-semibold text-primary">
                                          {meal.recipe.nutrition.calories}
                                        </span>
                                        <span>kcal</span>
                                      </div>
                                      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                                        <span>P {meal.recipe.nutrition.protein}g</span>
                                        <span>C {meal.recipe.nutrition.carbs}g</span>
                                        <span>F {meal.recipe.nutrition.fats}g</span>
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
