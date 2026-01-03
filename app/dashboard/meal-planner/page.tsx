'use client';

import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const GET_MEAL_PLANS = gql`
  query GetMealPlans($userId: String!) {
    getMealPlans(userId: $userId) {
      id
      name
      startDate
      endDate
      isActive
      createdAt
      updatedAt
    }
  }
`;

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

const UPDATE_MEAL_PLAN = gql`
  mutation UpdateMealPlan($input: UpdateMealPlanInput!) {
    updateMealPlan(input: $input) {
      id
      name
      startDate
      endDate
      isActive
    }
  }
`;

const DELETE_MEAL_PLAN = gql`
  mutation DeleteMealPlan($id: String!) {
    deleteMealPlan(id: $id)
  }
`;

interface MealPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MealPlannerPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data, loading, error, refetch } = useQuery<{ getMealPlans: MealPlan[] }>(GET_MEAL_PLANS, {
    variables: {
      userId: session?.user?.id,
    },
    skip: !session?.user?.id,
  });

  const [createMealPlan, { loading: duplicating }] = useMutation(CREATE_MEAL_PLAN, {
    onCompleted: (data) => {
      refetch();
      router.push(`/dashboard/meal-planner/${data.createMealPlan.id}`);
    },
    onError: (error) => {
      alert(`Failed to duplicate meal plan: ${error.message}`);
    },
  });

  const [updateMealPlan, { loading: updating }] = useMutation(UPDATE_MEAL_PLAN, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Failed to update meal plan: ${error.message}`);
    },
  });

  const [deleteMealPlan, { loading: deleting }] = useMutation(DELETE_MEAL_PLAN, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Failed to delete meal plan: ${error.message}`);
    },
  });

  const mealPlans = data?.getMealPlans || [];

  const handleDelete = async (planId: string, planName: string) => {
    if (confirm(`Are you sure you want to delete "${planName}"? This action cannot be undone.`)) {
      await deleteMealPlan({
        variables: { id: planId },
      });
    }
  };

  const handleActivate = async (planId: string) => {
    // First, deactivate all other plans
    const updatePromises = mealPlans
      .filter(p => p.isActive && p.id !== planId)
      .map(p =>
        updateMealPlan({
          variables: {
            input: {
              id: p.id,
              isActive: false,
            },
          },
        })
      );

    await Promise.all(updatePromises);

    // Then activate the selected plan
    await updateMealPlan({
      variables: {
        input: {
          id: planId,
          isActive: true,
        },
      },
    });
  };

  const handleDuplicate = async (plan: MealPlan) => {
    if (!session?.user?.id) {
      alert('You must be logged in to duplicate a meal plan');
      return;
    }

    const today = new Date();
    const duration = new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime();
    const durationDays = Math.ceil(duration / (1000 * 60 * 60 * 24));

    const newStartDate = today.toISOString().split('T')[0];
    const newEndDate = new Date(today.getTime() + duration).toISOString().split('T')[0];

    await createMealPlan({
      variables: {
        input: {
          userId: session.user.id,
          name: `${plan.name} (Copy)`,
          startDate: newStartDate,
          endDate: newEndDate,
        },
      },
    });
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading meal plans...</p>
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
            <CardTitle className="text-red-700">Error Loading Meal Plans</CardTitle>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Meal Planner
            </h1>
            <p className="text-gray-600">Create and manage your custom meal plans</p>
          </div>
          <Link href="/dashboard/meal-planner/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Create New Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Plan */}
      {mealPlans.filter(p => p.isActive).map((plan) => (
        <Card key={plan.id} className="mb-8 border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    ACTIVE
                  </span>
                </div>
                <CardDescription className="text-base">
                  {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Duration</p>
                <p className="text-2xl font-bold text-blue-600">{calculateDays(plan.startDate, plan.endDate)} days</p>
              </div>
              <div className="p-4 bg-white rounded-lg flex items-center justify-center">
                <Link href={`/dashboard/meal-planner/${plan.id}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    View & Edit Plan
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Past Plans */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4">Past Meal Plans</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mealPlans.filter(p => !p.isActive).map((plan) => (
          <Card key={plan.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>
                {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{calculateDays(plan.startDate, plan.endDate)} days</span>
                </div>
                <div className="space-y-2 mt-4">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                    onClick={() => handleActivate(plan.id)}
                    disabled={updating}
                  >
                    {updating ? 'Activating...' : 'Set as Active'}
                  </Button>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/meal-planner/${plan.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        View
                      </Button>
                    </Link>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="sm"
                      onClick={() => handleDuplicate(plan)}
                      disabled={duplicating}
                    >
                      {duplicating ? 'Duplicating...' : 'Duplicate'}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    size="sm"
                    onClick={() => handleDelete(plan.id, plan.name)}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mealPlans.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle>No Meal Plans Yet</CardTitle>
            <CardDescription>
              Create your first meal plan to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/meal-planner/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Create Your First Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
