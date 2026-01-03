'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      alert(`Failed to add meal: ${error.message}`);
    },
  });

  const [removeMealFromPlan] = useMutation(REMOVE_MEAL_FROM_PLAN, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Failed to remove meal: ${error.message}`);
    },
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading meal plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.getMealPlan) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Meal Plan</CardTitle>
            <CardDescription className="text-red-600">
              {error?.message || 'Meal plan not found'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/meal-planner">
              <Button variant="outline">Back to Meal Plans</Button>
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
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-700">No Days in Meal Plan</CardTitle>
            <CardDescription className="text-yellow-600">
              This meal plan has no days configured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/meal-planner">
              <Button variant="outline">Back to Meal Plans</Button>
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
      alert('Please select a recipe');
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
        </div>
      </div>

      {/* Day Navigation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {mealPlan.days.map((day, index) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(index)}
                className={`flex-shrink-0 p-4 rounded-lg border-2 transition-all ${
                  selectedDay === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Day {index + 1}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-lg font-bold text-blue-600 mt-2">{day.totalCalories}</p>
                  <p className="text-xs text-gray-500">kcal</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day Overview */}
      <Card className="mb-6 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                Day {selectedDay + 1} - {new Date(currentDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Plan your meals for this day
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-blue-600">{currentDay.totalCalories}</p>
              <p className="text-sm text-gray-600">kcal total</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mealPlan.avgDailyCalories > 0 && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((currentDay.totalCalories / mealPlan.avgDailyCalories) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm font-medium text-gray-700">
                  {Math.round((currentDay.totalCalories / mealPlan.avgDailyCalories) * 100)}% of avg daily calories ({mealPlan.avgDailyCalories} kcal)
                </p>
                <p className="text-sm text-gray-600">
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
      <div className="space-y-6">
        {MEAL_TYPES.map((mealType) => {
          const meals = getMealsByType(mealType);
          const mealTypeCalories = getMealTypeCalories(mealType);

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
                  <Dialog open={addMealDialogOpen && selectedMealType === mealType} onOpenChange={(open) => {
                    setAddMealDialogOpen(open);
                    if (open) {
                      setSelectedMealType(mealType);
                      setRecipeFilter(mealType);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2">
                        + Add Recipe
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add Recipe to {mealType}</DialogTitle>
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
                            <p className="text-sm text-gray-500">Loading recipes...</p>
                          ) : recipes.length === 0 ? (
                            <p className="text-sm text-gray-500">No recipes found for this meal type</p>
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
                            className="bg-blue-600 hover:bg-blue-700"
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
                  <div className="text-center py-8 text-gray-500">
                    <p>No recipes added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{meal.recipe.name}</h4>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>{meal.recipe.nutrition.calories} kcal</span>
                            <span>P: {meal.recipe.nutrition.protein}g</span>
                            <span>C: {meal.recipe.nutrition.carbs}g</span>
                            <span>F: {meal.recipe.nutrition.fats}g</span>
                          </div>
                          {meal.notes && (
                            <p className="text-sm text-gray-500 mt-2 italic">{meal.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
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

      {/* Quick Actions */}
      <Card className="mt-8 border-2 border-dashed">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage this meal plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleClearDay}>
              Clear This Day
            </Button>
            <Link href="/dashboard/recipes">
              <Button variant="outline">Browse All Recipes</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
