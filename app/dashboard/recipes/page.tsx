'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Mock data - replace with GraphQL later
const MOCK_RECIPES = [
  {
    id: '1',
    name: 'Oatmeal with Protein Powder and Berries',
    description: 'A nutritious breakfast packed with protein and antioxidants',
    calories: 450,
    protein: 30,
    carbs: 55,
    fats: 12,
    mealType: 'BREAKFAST',
    imageUrl: null,
  },
  {
    id: '2',
    name: 'Grilled Chicken Breast with Rice and Vegetables',
    description: 'Classic bodybuilding meal with lean protein and complex carbs',
    calories: 750,
    protein: 65,
    carbs: 80,
    fats: 15,
    mealType: 'LUNCH',
    imageUrl: null,
  },
  {
    id: '3',
    name: 'Salmon with Quinoa and Asparagus',
    description: 'Rich in omega-3s and complete protein',
    calories: 850,
    protein: 55,
    carbs: 70,
    fats: 35,
    mealType: 'DINNER',
    imageUrl: null,
  },
  {
    id: '4',
    name: 'Greek Yogurt with Almonds',
    description: 'Perfect high-protein snack',
    calories: 200,
    protein: 18,
    carbs: 15,
    fats: 8,
    mealType: 'SNACK',
    imageUrl: null,
  },
  {
    id: '5',
    name: 'Protein Pancakes with Maple Syrup',
    description: 'Delicious high-protein breakfast',
    calories: 550,
    protein: 40,
    carbs: 60,
    fats: 14,
    mealType: 'BREAKFAST',
    imageUrl: null,
  },
  {
    id: '6',
    name: 'Turkey Wrap with Sweet Potato',
    description: 'Balanced lunch with lean protein',
    calories: 700,
    protein: 50,
    carbs: 75,
    fats: 18,
    mealType: 'LUNCH',
    imageUrl: null,
  },
];

type MealType = 'ALL' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('ALL');

  const filteredRecipes = MOCK_RECIPES.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMealType = selectedMealType === 'ALL' || recipe.mealType === selectedMealType;
    return matchesSearch && matchesMealType;
  });

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
        {filteredRecipes.map((recipe) => (
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
                  <p className="text-3xl font-bold text-blue-600">{recipe.calories}</p>
                  <p className="text-sm text-gray-600">kcal</p>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="font-bold text-green-700">{recipe.protein}g</p>
                    <p className="text-gray-600 text-xs">Protein</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="font-bold text-blue-700">{recipe.carbs}g</p>
                    <p className="text-gray-600 text-xs">Carbs</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <p className="font-bold text-orange-700">{recipe.fats}g</p>
                    <p className="text-gray-600 text-xs">Fats</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1" size="sm">
                    View Details
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" size="sm">
                    Add to Plan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredRecipes.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle>No Recipes Found</CardTitle>
            <CardDescription>
              Try adjusting your filters or search term
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
