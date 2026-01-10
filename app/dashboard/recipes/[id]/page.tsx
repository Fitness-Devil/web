'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/rest-client';

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
  servings?: number;
  ingredients?: string[];
  instructions?: string[];
  imageUrl?: string | null;
}

export default function RecipeDetailPage() {
  const params = useParams();
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadRecipe = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<Recipe>(`/recipes/${recipeId}`);
        setRecipe(data);
        setError(null);
      } catch (fetchError) {
        setError(fetchError as Error);
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      loadRecipe();
    }
  }, [recipeId]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading recipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Recipe Not Found</CardTitle>
            <CardDescription className="text-destructive">
              {error?.message || 'Unable to load recipe details.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/recipes">
              <Button variant="outline" className="border-white/10 bg-white/5 text-white">
                Back to Recipes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/recipes">
          <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white">
            ← Back to Recipes
          </Button>
        </Link>
        <Link href={`/dashboard/recipes/${recipe.id}/edit`}>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Edit Recipe
          </Button>
        </Link>
      </div>

      <Card className="border-white/10 bg-card/80">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Recipe</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <CardTitle className="text-2xl text-white">{recipe.name}</CardTitle>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {recipe.mealType}
            </span>
          </div>
          <CardDescription className="mt-2">{recipe.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {recipe.imageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img
                src={recipe.imageUrl}
                alt={recipe.name}
                className="h-64 w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Calories</p>
              <p className="mt-2 text-3xl font-semibold text-primary">
                {recipe.nutrition.calories}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">kcal</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Macros</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div>
                  <p className="text-sm font-semibold text-white">{recipe.nutrition.protein}g</p>
                  <p>Protein</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{recipe.nutrition.carbs}g</p>
                  <p>Carbs</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{recipe.nutrition.fats}g</p>
                  <p>Fats</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ingredients</p>
              <ul className="mt-3 space-y-2 text-sm text-white">
                {(recipe.ingredients || []).length === 0 ? (
                  <li className="text-sm text-muted-foreground">No ingredients listed.</li>
                ) : (
                  recipe.ingredients?.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Instructions</p>
              <ol className="mt-3 space-y-2 text-sm text-white">
                {(recipe.instructions || []).length === 0 ? (
                  <li className="text-sm text-muted-foreground">No instructions listed.</li>
                ) : (
                  recipe.instructions?.map((step, index) => (
                    <li key={`${step}-${index}`} className="flex gap-2">
                      <span className="text-primary">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))
                )}
              </ol>
            </div>
          </div>

          {recipe.servings ? (
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Servings: <span className="text-white">{recipe.servings}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
