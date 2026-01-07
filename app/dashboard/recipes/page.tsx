'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineNotice } from '@/components/ui/inline-notice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const GET_RECIPES = gql`
  query GetRecipes($limit: Int, $offset: Int, $search: String, $mealType: MealType) {
    getRecipes(limit: $limit, offset: $offset, search: $search, mealType: $mealType) {
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

const GET_MEAL_PLANS = gql`
  query GetMealPlans($userId: String!) {
    getMealPlans(userId: $userId) {
      id
      name
      startDate
      endDate
      isActive
    }
  }
`;

const ADD_MEAL_TO_PLAN = gql`
  mutation AddMealToPlan($input: AddMealInput!) {
    addMealToPlan(input: $input) {
      id
      mealType
      orderIndex
    }
  }
`;

type MealType = 'ALL' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

interface Recipe {
  id: string;
  name: string;
  description: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  mealType: string;
  imageUrl: string | null;
}

export default function RecipesPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('ALL');
  const [addToPlanDialogOpen, setAddToPlanDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMealSlot, setSelectedMealSlot] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>('BREAKFAST');
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );

  const { data, loading, error } = useQuery<{ getRecipes: Recipe[] }>(GET_RECIPES, {
    variables: {
      limit: 100,
      offset: 0,
      search: searchTerm || undefined,
      mealType: selectedMealType !== 'ALL' ? selectedMealType : undefined,
    },
  });

  const { data: mealPlansData } = useQuery<{ getMealPlans: any[] }>(GET_MEAL_PLANS, {
    variables: { userId: session?.user?.id },
    skip: !session?.user?.id,
  });

  const [addMealToPlan, { loading: addingMeal }] = useMutation(ADD_MEAL_TO_PLAN, {
    onCompleted: () => {
      setNotice({ type: 'success', message: 'Recipe added to meal plan.' });
      setAddToPlanDialogOpen(false);
      setSelectedRecipe(null);
      setSelectedPlanId('');
      setSelectedDate('');
    },
    onError: (error) => {
      setNotice({ type: 'error', message: `Failed to add recipe: ${error.message}` });
    },
  });

  const recipes = data?.getRecipes || [];
  const mealPlans = mealPlansData?.getMealPlans || [];

  const handleAddToPlan = async () => {
    if (!selectedRecipe || !selectedPlanId || !selectedDate) {
      setNotice({ type: 'info', message: 'Please select a meal plan and date.' });
      return;
    }

    await addMealToPlan({
      variables: {
        input: {
          mealPlanId: selectedPlanId,
          date: selectedDate,
          recipeId: selectedRecipe.id,
          mealType: selectedMealSlot,
          notes: null,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading recipes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Error Loading Recipes</CardTitle>
            <CardDescription className="text-destructive">
              {error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-6xl flex-col gap-6 overflow-hidden">
      {notice ? <InlineNotice message={notice.message} type={notice.type} /> : null}
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Recipes</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Recipe Library</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse and explore nutritious recipes for your meal plans.
          </p>
        </div>
        <Link href="/dashboard/recipes/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Add Recipe
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="max-w-md">
          <Input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Meal Type Filter */}
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealType[]).map((type) => (
            <Button
              key={type}
              variant={selectedMealType === type ? 'default' : 'outline'}
              onClick={() => setSelectedMealType(type)}
              className={selectedMealType === type ? 'bg-primary text-primary-foreground' : 'border-white/10 bg-white/5 text-white'}
            >
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Recipe Table */}
      <Card className="flex flex-1 flex-col overflow-hidden border-white/10 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Recipes</CardTitle>
          <CardDescription className="text-sm">
            {recipes.length} recipes found
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
          <div className="hidden grid-cols-[2fr_0.9fr_0.7fr_0.9fr] items-center gap-4 border-b border-white/10 pb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground md:grid">
            <span>Name</span>
            <span>Meal Type</span>
            <span>Calories</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 divide-y divide-white/10 scrollbar-dark">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="grid gap-3 py-4 md:grid-cols-[2fr_0.9fr_0.7fr_0.9fr] md:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{recipe.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {recipe.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground md:hidden">
                    <span className="rounded-full border border-white/10 px-2 py-1">
                      {recipe.mealType}
                    </span>
                    <span>{recipe.nutrition.calories} kcal</span>
                    <span>P {recipe.nutrition.protein}g</span>
                    <span>C {recipe.nutrition.carbs}g</span>
                    <span>F {recipe.nutrition.fats}g</span>
                  </div>
                </div>
                <div className="hidden md:flex">
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {recipe.mealType}
                  </span>
                </div>
                <div className="hidden md:block text-sm font-semibold text-white">
                  {recipe.nutrition.calories} kcal
                </div>
                <div className="flex gap-2 md:justify-end">
                  <Link href={`/dashboard/recipes/${recipe.id}`}>
                    <Button variant="outline" className="border-white/10 bg-white/5 text-white" size="sm">
                      View
                    </Button>
                  </Link>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setSelectedMealSlot(recipe.mealType as any);
                      setAddToPlanDialogOpen(true);
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {recipes.length === 0 && (
        <Card className="border-white/10 bg-card/70">
          <CardHeader>
            <CardTitle className="text-white">No Recipes Found</CardTitle>
            <CardDescription>
              Try adjusting your filters or search term
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Add to Plan Dialog */}
      <Dialog open={addToPlanDialogOpen} onOpenChange={setAddToPlanDialogOpen}>
        <DialogContent className="max-w-md border-white/10 bg-card/95">
          <DialogHeader>
            <DialogTitle className="text-white">
              Add {selectedRecipe?.name} to Meal Plan
            </DialogTitle>
            <DialogDescription>
              Select the meal plan, date, and meal type
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="mealPlan">Select Meal Plan</Label>
              {mealPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meal plans available. Create one first!</p>
              ) : (
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a meal plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealPlans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} {plan.isActive && '(Active)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mealSlot">Meal Type</Label>
              <Select value={selectedMealSlot} onValueChange={(value) => setSelectedMealSlot(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                  <SelectItem value="SNACK">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setAddToPlanDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToPlan}
                disabled={!selectedPlanId || !selectedDate || addingMeal}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {addingMeal ? 'Adding...' : 'Add to Plan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
