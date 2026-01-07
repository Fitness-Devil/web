'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InlineNotice } from '@/components/ui/inline-notice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const GET_MEAL_PLAN = gql`
  query GetMealPlan($id: String!) {
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
          orderIndex
          notes
          recipe {
            id
            name
            description
            nutrition {
              calories
              protein
              carbs
              fats
            }
            mealType
            imageUrl
          }
        }
      }
    }
  }
`;

const GET_RECIPES = gql`
  query GetRecipes($limit: Int, $offset: Int, $mealType: MealType) {
    getRecipes(limit: $limit, offset: $offset, mealType: $mealType) {
      id
      name
      description
      nutrition {
        calories
        protein
        carbs
        fats
      }
      mealType
      imageUrl
    }
  }
`;

const ADD_MEAL_TO_PLAN = gql`
  mutation AddMealToPlan($input: AddMealInput!) {
    addMealToPlan(input: $input) {
      id
      mealType
      orderIndex
      notes
      recipe {
        id
        name
        nutrition {
          calories
          protein
          carbs
          fats
        }
        mealType
      }
    }
  }
`;

const REMOVE_MEAL_FROM_PLAN = gql`
  mutation RemoveMealFromPlan($mealId: String!) {
    removeMealFromPlan(mealId: $mealId)
  }
`;

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;
type MealType = typeof MEAL_TYPES[number];

interface Recipe {
  id: string;
  name: string;
  description?: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  mealType: string;
  imageUrl?: string;
}

interface Meal {
  id: string;
  mealType: string;
  orderIndex: number;
  notes?: string;
  recipe: Recipe;
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

export default function MealPlanEditorPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [selectedDay, setSelectedDay] = useState(0);
  const [addMealDialogOpen, setAddMealDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('BREAKFAST');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [mealNotes, setMealNotes] = useState('');
  const [recipeFilter, setRecipeFilter] = useState<MealType | 'ALL'>('ALL');
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );

  const { data, loading, error, refetch } = useQuery<{ getMealPlan: MealPlan }>(GET_MEAL_PLAN, {
    variables: { id: planId },
  });

  const { data: recipesData, loading: recipesLoading } = useQuery<{ getRecipes: Recipe[] }>(GET_RECIPES, {
    variables: {
      limit: 100,
      offset: 0,
      mealType: recipeFilter === 'ALL' ? null : recipeFilter
    },
  });

  const [addMealToPlan, { loading: addingMeal }] = useMutation(ADD_MEAL_TO_PLAN, {
    onCompleted: () => {
      refetch();
      setAddMealDialogOpen(false);
      setSelectedRecipeId('');
      setMealNotes('');
    },
    onError: (error) => {
      setNotice({ type: 'error', message: `Failed to add meal: ${error.message}` });
    },
  });

  const [removeMealFromPlan] = useMutation(REMOVE_MEAL_FROM_PLAN, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      setNotice({ type: 'error', message: `Failed to remove meal: ${error.message}` });
    },
  });

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading meal plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.getMealPlan) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Error Loading Meal Plan</CardTitle>
            <CardDescription className="text-destructive">
              {error?.message || 'Meal plan not found'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/meal-planner">
              <Button variant="outline" className="border-white/10 bg-white/5 text-white">
                Back to Meal Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mealPlan = data.getMealPlan;
  const recipes = recipesData?.getRecipes || [];

  if (!mealPlan.days || mealPlan.days.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">No Days in Meal Plan</CardTitle>
            <CardDescription className="text-muted-foreground">
              This meal plan has no days configured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/meal-planner">
              <Button variant="outline" className="border-white/10 bg-white/5 text-white">
                Back to Meal Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentDay = mealPlan.days[selectedDay];

  const getMealsByType = (mealType: MealType): Meal[] => {
    return currentDay.meals.filter(meal => meal.mealType === mealType);
  };

  const getMealTypeCalories = (mealType: MealType): number => {
    return getMealsByType(mealType).reduce((sum, meal) =>
      sum + meal.recipe.nutrition.calories, 0
    );
  };

  const handleAddMeal = async () => {
    if (!selectedRecipeId || !currentDay) {
      setNotice({ type: 'info', message: 'Please select a recipe.' });
      return;
    }

    await addMealToPlan({
      variables: {
        input: {
          mealPlanId: planId,
          date: currentDay.date,
          recipeId: selectedRecipeId,
          mealType: selectedMealType,
          notes: mealNotes || null,
        },
      },
    });
  };

  const handleRemoveMeal = async (mealId: string) => {
    if (confirm('Are you sure you want to remove this meal?')) {
      await removeMealFromPlan({
        variables: { mealId },
      });
    }
  };

  const handleClearDay = async () => {
    if (confirm('Are you sure you want to clear all meals from this day?')) {
      const mealIds = currentDay.meals.map(m => m.id);
      for (const mealId of mealIds) {
        await removeMealFromPlan({ variables: { mealId } });
      }
    }
  };

  const getMealTypeLabel = (type: MealType) => type.charAt(0) + type.slice(1).toLowerCase();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {notice ? <InlineNotice message={notice.message} type={notice.type} /> : null}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/meal-planner">
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white">
              ← Back to Plans
            </Button>
          </Link>
          <p className="mt-5 text-xs uppercase tracking-[0.4em] text-muted-foreground">Meal Plan</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{mealPlan.name}</h1>
            {mealPlan.isActive && (
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Active
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date(mealPlan.startDate).toLocaleDateString()} - {new Date(mealPlan.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleClearDay} className="border-white/10 bg-white/5 text-white">
            Clear Day
          </Button>
          <Link href="/dashboard/recipes">
            <Button variant="outline" className="border-white/10 bg-white/5 text-white">
              Browse Recipes
            </Button>
          </Link>
        </div>
      </div>

      {/* Day Navigation */}
      <Card className="border-white/10 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Select Day</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {mealPlan.days.map((day, index) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(index)}
                className={`flex-shrink-0 rounded-2xl border px-4 py-3 text-left transition ${
                  selectedDay === index
                    ? 'border-primary/40 bg-primary/10 text-white'
                    : 'border-white/10 bg-white/5 text-muted-foreground hover:border-primary/30'
                }`}
              >
                <p className="text-xs uppercase tracking-[0.2em]">Day {index + 1}</p>
                <p className="mt-1 text-sm">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{day.totalCalories}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">kcal</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day Overview */}
      <Card className="border-white/10 bg-card/80">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-white">
                Day {selectedDay + 1} - {new Date(currentDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardTitle>
              <CardDescription className="text-sm">Plan your meals for this day</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-primary">{currentDay.totalCalories}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">kcal total</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mealPlan.avgDailyCalories > 0 && (
            <>
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-500"
                  style={{ width: `${Math.min((currentDay.totalCalories / mealPlan.avgDailyCalories) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">
                  {Math.round((currentDay.totalCalories / mealPlan.avgDailyCalories) * 100)}% of avg daily calories ({mealPlan.avgDailyCalories} kcal)
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentDay.totalCalories < mealPlan.avgDailyCalories
                    ? `${mealPlan.avgDailyCalories - currentDay.totalCalories} kcal remaining`
                    : `${currentDay.totalCalories - mealPlan.avgDailyCalories} kcal over`}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Meal Slots */}
      <div className="grid gap-4 lg:grid-cols-2">
        {MEAL_TYPES.map((mealType) => {
          const meals = getMealsByType(mealType);
          const mealTypeCalories = getMealTypeCalories(mealType);

          return (
            <Card key={mealType} className="border-white/10 bg-card/80">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-white">
                      {getMealTypeLabel(mealType)}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {meals.length} {meals.length === 1 ? 'recipe' : 'recipes'} • {mealTypeCalories} kcal
                    </CardDescription>
                  </div>
                  <Dialog open={addMealDialogOpen && selectedMealType === mealType} onOpenChange={(open) => {
                    setAddMealDialogOpen(open);
                    if (open) {
                      setSelectedMealType(mealType);
                      setRecipeFilter(mealType);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2 border-white/10 bg-white/5 text-white">
                        + Add Recipe
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-white/10 bg-card/95">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add Recipe to {getMealTypeLabel(mealType)}</DialogTitle>
                        <DialogDescription>
                          Select a recipe to add to this meal slot
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="mealTypeFilter">Filter by Meal Type</Label>
                          <Select value={recipeFilter} onValueChange={(value) => {
                            setRecipeFilter(value as MealType | 'ALL');
                            setSelectedRecipeId(''); // Reset selection when filter changes
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="All recipes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">All Recipes</SelectItem>
                              <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                              <SelectItem value="LUNCH">Lunch</SelectItem>
                              <SelectItem value="DINNER">Dinner</SelectItem>
                              <SelectItem value="SNACK">Snack</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recipe">Select Recipe</Label>
                          {recipesLoading ? (
                            <p className="text-sm text-muted-foreground">Loading recipes...</p>
                          ) : recipes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No recipes found for this meal type</p>
                          ) : (
                            <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a recipe" />
                              </SelectTrigger>
                              <SelectContent>
                                {recipes.map((recipe) => (
                                  <SelectItem key={recipe.id} value={recipe.id}>
                                    {recipe.name} ({recipe.nutrition.calories} kcal)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes (optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Add any notes about this meal..."
                            value={mealNotes}
                            onChange={(e) => setMealNotes(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAddMealDialogOpen(false);
                              setSelectedRecipeId('');
                              setMealNotes('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddMeal}
                            disabled={!selectedRecipeId || addingMeal}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {addingMeal ? 'Adding...' : 'Add to Plan'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {meals.length === 0 ? (
                  <div className="py-6 text-sm text-muted-foreground">
                    No recipes added yet.
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="grid gap-3 py-3 md:grid-cols-[1.6fr_0.6fr_0.8fr_0.4fr] md:items-center"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-white">{meal.recipe.name}</h4>
                          {meal.notes && (
                            <p className="mt-1 text-xs text-muted-foreground">{meal.notes}</p>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-white md:text-center">
                          {meal.recipe.nutrition.calories} kcal
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground md:justify-center">
                          <span>P {meal.recipe.nutrition.protein}g</span>
                          <span>C {meal.recipe.nutrition.carbs}g</span>
                          <span>F {meal.recipe.nutrition.fats}g</span>
                        </div>
                        <div className="flex md:justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemoveMeal(meal.id)}
                          >
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
    </div>
  );
}
