'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CREATE_MEAL_PLAN = gql`
  mutation CreateMealPlan($input: CreateMealPlanInput!) {
    createMealPlan(input: $input) {
      id
      name
      startDate
      endDate
      isActive
    }
  }
`;

export default function NewMealPlanPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    goalCalories: 2200,
    description: '',
  });

  const [createMealPlan, { loading, error }] = useMutation<{
    createMealPlan: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      isActive: boolean;
    };
  }>(CREATE_MEAL_PLAN, {
    onCompleted: (data) => {
      console.log('Meal plan created:', data.createMealPlan);
      alert('Meal plan created successfully!');
      // Redirect to the meal planner list
      router.push('/dashboard/meal-planner');
    },
    onError: (error) => {
      console.error('Error creating meal plan:', error);
      const errorMsg = error.message.includes('foreign key')
        ? 'You need to set up your nutrition profile first. Go to Settings → Nutrition Profile.'
        : error.message;
      alert(`Failed to create meal plan: ${errorMsg}`);
    },
    refetchQueries: ['GetMealPlans'], // Refresh the meal plans list
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      alert('You must be logged in to create a meal plan');
      return;
    }

    try {
      await createMealPlan({
        variables: {
          input: {
            userId: session.user.id,
            name: formData.name,
            startDate: formData.startDate,
            endDate: formData.endDate,
          },
        },
      });
    } catch (err) {
      console.error('Mutation error:', err);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate number of days
  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const days = calculateDays();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/meal-planner">
            <Button variant="outline" size="sm">
              ← Back to Plans
            </Button>
          </Link>
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create New Meal Plan
          </h1>
          <p className="text-gray-600">Set up your custom meal plan and start planning your nutrition</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Give your meal plan a name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Summer Cutting Plan"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">Choose a descriptive name for your meal plan</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="e.g., 8-week cutting phase for summer"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Date Range */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
            <CardDescription>Set the start and end dates for your meal plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  min={formData.startDate}
                  required
                />
              </div>
            </div>

            {days > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Your meal plan will span <span className="font-bold">{days}</span> {days === 1 ? 'day' : 'days'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrition Goals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nutrition Goals</CardTitle>
            <CardDescription>Set your daily calorie target for this plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goalCalories">Daily Calorie Goal *</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="goalCalories"
                  type="number"
                  min="1000"
                  max="5000"
                  step="50"
                  value={formData.goalCalories}
                  onChange={(e) => handleChange('goalCalories', parseInt(e.target.value) || 0)}
                  className="max-w-xs"
                  required
                />
                <span className="text-sm text-gray-600">kcal/day</span>
              </div>
              <p className="text-sm text-gray-500">
                This will be your target daily calorie intake. You can adjust individual days later.
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Quick Reference</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Cutting:</p>
                  <p className="font-medium">1800-2200 kcal</p>
                </div>
                <div>
                  <p className="text-gray-600">Maintenance:</p>
                  <p className="font-medium">2200-2800 kcal</p>
                </div>
                <div>
                  <p className="text-gray-600">Bulking:</p>
                  <p className="font-medium">2800-3500 kcal</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="mb-6 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle>Plan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan Name:</span>
                <span className="font-medium">{formData.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Daily Calorie Goal:</span>
                <span className="font-medium">{formData.goalCalories} kcal</span>
              </div>
              {days > 0 && (
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-gray-600">Total Calories (est.):</span>
                  <span className="font-bold text-blue-600">
                    {(formData.goalCalories * days).toLocaleString()} kcal
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/meal-planner">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!formData.name || !formData.startDate || !formData.endDate || loading}
          >
            {loading ? 'Creating...' : 'Create Meal Plan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
