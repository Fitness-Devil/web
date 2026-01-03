'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      alert('Recipe added to meal plan!');
      setAddToPlanDialogOpen(false);
      setSelectedRecipe(null);
      setSelectedPlanId('');
      setSelectedDate('');
    },
    onError: (error) => {
      alert(`Failed to add recipe: ${error.message}`);
    },
  });

  const recipes = data?.getRecipes || [];
  const mealPlans = mealPlansData?.getMealPlans || [];

  const handleAddToPlan = async () => {
    if (!selectedRecipe || !selectedPlanId || !selectedDate) {
      alert('Please select a meal plan and date');
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
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recipes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Recipes</CardTitle>
            <CardDescription className="text-red-600">
              {error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Recipe Library
        </h1>
        <p className="text-gray-600">Browse and explore nutritious recipes for your meal plans</p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
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
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealType[]).map((type) => (
            <Button
              key={type}
              variant={selectedMealType === type ? 'default' : 'outline'}
              onClick={() => setSelectedMealType(type)}
              className={selectedMealType === type ? 'bg-blue-600' : ''}
            >
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="hover:shadow-xl transition-all duration-200 border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight mb-2">{recipe.name}</CardTitle>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {recipe.mealType}
                  </span>
                </div>
              </div>
              <CardDescription className="mt-2">{recipe.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Calories */}
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-blue-600">{recipe.nutrition.calories}</p>
                  <p className="text-sm text-gray-600">kcal</p>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="font-bold text-green-700">{recipe.nutrition.protein}g</p>
                    <p className="text-gray-600 text-xs">Protein</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="font-bold text-blue-700">{recipe.nutrition.carbs}g</p>
                    <p className="text-gray-600 text-xs">Carbs</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <p className="font-bold text-orange-700">{recipe.nutrition.fats}g</p>
                    <p className="text-gray-600 text-xs">Fats</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1" size="sm">
                    View Details
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    size="sm"
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setSelectedMealSlot(recipe.mealType as any);
                      setAddToPlanDialogOpen(true);
                    }}
                  >
                    Add to Plan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {recipes.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle>No Recipes Found</CardTitle>
            <CardDescription>
              Try adjusting your filters or search term
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Add to Plan Dialog */}
      <Dialog open={addToPlanDialogOpen} onOpenChange={setAddToPlanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add {selectedRecipe?.name} to Meal Plan</DialogTitle>
            <DialogDescription>
              Select the meal plan, date, and meal type
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="mealPlan">Select Meal Plan</Label>
              {mealPlans.length === 0 ? (
                <p className="text-sm text-gray-500">No meal plans available. Create one first!</p>
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
                className="bg-blue-600 hover:bg-blue-700"
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
