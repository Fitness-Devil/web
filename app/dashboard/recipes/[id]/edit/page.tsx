'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineNotice } from '@/components/ui/inline-notice';
import { apiFetch } from '@/lib/rest-client';

const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mealType, setMealType] = useState<(typeof mealTypes)[number]>('BREAKFAST');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );

  useEffect(() => {
    const loadRecipe = async () => {
      setLoading(true);
      try {
        const recipe = await apiFetch<any>(`/recipes/${recipeId}`);
        setName(recipe.name || '');
        setDescription(recipe.description || '');
        setImageUrl(recipe.imageUrl || '');
        setMealType(recipe.mealType || 'BREAKFAST');
        setCalories(recipe.nutrition?.calories?.toString() || '');
        setProtein(recipe.nutrition?.protein?.toString() || '');
        setCarbs(recipe.nutrition?.carbs?.toString() || '');
        setFats(recipe.nutrition?.fats?.toString() || '');
        setServings(recipe.servings?.toString() || '');
        setIngredients((recipe.ingredients || []).join('\n'));
        setInstructions((recipe.instructions || []).join('\n'));
      } catch (fetchError) {
        setNotice({ type: 'error', message: `Failed to load recipe: ${(fetchError as Error).message}` });
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      loadRecipe();
    }
  }, [recipeId]);

  const parseLines = (value: string) =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setSaving(true);
    try {
      await apiFetch(`/recipes/${recipeId}`, {
        method: 'PUT',
        body: {
          name,
          description: description || null,
          imageUrl: imageUrl || null,
          mealType,
          servings: servings ? Number(servings) : null,
          nutrition: {
            calories: calories ? Number(calories) : 0,
            protein: protein ? Number(protein) : 0,
            carbs: carbs ? Number(carbs) : 0,
            fats: fats ? Number(fats) : 0,
          },
          ingredients: parseLines(ingredients),
          instructions: parseLines(instructions),
        },
      });
      router.push(`/dashboard/recipes/${recipeId}`);
    } catch (saveError) {
      setNotice({ type: 'error', message: `Failed to update recipe: ${(saveError as Error).message}` });
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {notice ? <InlineNotice message={notice.message} type={notice.type} /> : null}
      <Link href={`/dashboard/recipes/${recipeId}`}>
        <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white">
          ← Back to Recipe
        </Button>
      </Link>

      <Card className="border-white/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Edit Recipe</CardTitle>
          <CardDescription>Update the details for this recipe.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Recipe Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mealType">Meal Type</Label>
                <Select value={mealType} onValueChange={(value) => setMealType(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input id="calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input id="protein" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input id="carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fats">Fats (g)</Label>
                <Input id="fats" type="number" value={fats} onChange={(e) => setFats(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="servings">Servings</Label>
                <Input id="servings" type="number" value={servings} onChange={(e) => setServings(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingredients (one per line)</Label>
                <Textarea id="ingredients" value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions (one per line)</Label>
                <Textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={6} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Link href={`/dashboard/recipes/${recipeId}`}>
                <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
