'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InlineNotice } from '@/components/ui/inline-notice';

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
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );

  const { data, loading, error, refetch } = useQuery<{ getMealPlans: MealPlan[] }>(GET_MEAL_PLANS, {
    variables: {
      userId: session?.user?.id,
    },
    skip: !session?.user?.id,
  });

  const [createMealPlan, { loading: duplicating }] = useMutation<{
    createMealPlan: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      isActive: boolean;
    };
  }>(CREATE_MEAL_PLAN, {
    onCompleted: (data) => {
      refetch();
      router.push(`/dashboard/meal-planner/${data.createMealPlan.id}`);
    },
    onError: (error) => {
      setNotice({ type: 'error', message: `Failed to duplicate meal plan: ${error.message}` });
    },
  });

  const [updateMealPlan, { loading: updating }] = useMutation<{
    updateMealPlan: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      isActive: boolean;
    };
  }>(UPDATE_MEAL_PLAN, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      setNotice({ type: 'error', message: `Failed to update meal plan: ${error.message}` });
    },
  });

  const [deleteMealPlan, { loading: deleting }] = useMutation<{
    deleteMealPlan: boolean;
  }>(DELETE_MEAL_PLAN, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      setNotice({ type: 'error', message: `Failed to delete meal plan: ${error.message}` });
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
      setNotice({ type: 'error', message: 'You must be logged in to duplicate a meal plan.' });
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
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading meal plans...</p>
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
            <CardTitle className="text-white">Error Loading Meal Plans</CardTitle>
            <CardDescription className="text-destructive">
              {error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      {notice ? <InlineNotice message={notice.message} type={notice.type} /> : null}
      {/* Header */}
      <div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Meal Planner</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Meal Planner</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create and manage your custom meal plans.
            </p>
          </div>
          <Link href="/dashboard/meal-planner/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create New Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Plan */}
      {mealPlans.filter(p => p.isActive).map((plan) => (
        <Card key={plan.id} className="border-white/10 bg-card/80">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
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
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Duration</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {calculateDays(plan.startDate, plan.endDate)} days
                </p>
              </div>
              <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4">
                <Link href={`/dashboard/meal-planner/${plan.id}`}>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    View & Edit Plan
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Past Plans */}
      <div>
        <h2 className="text-xl font-semibold text-white">Past Meal Plans</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mealPlans.filter(p => !p.isActive).map((plan) => (
          <Card key={plan.id} className="border-white/10 bg-card/70">
            <CardHeader>
              <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
              <CardDescription>
                {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Duration</span>
                  <span className="font-medium text-white">
                    {calculateDays(plan.startDate, plan.endDate)} days
                  </span>
                </div>
                <div className="space-y-2 mt-4">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                    onClick={() => handleActivate(plan.id)}
                    disabled={updating}
                  >
                    {updating ? 'Activating...' : 'Set as Active'}
                  </Button>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/meal-planner/${plan.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white" size="sm">
                        View
                      </Button>
                    </Link>
                    <Button
                      className="flex-1 bg-white/10 text-white hover:bg-white/20"
                      size="sm"
                      onClick={() => handleDuplicate(plan)}
                      disabled={duplicating}
                    >
                      {duplicating ? 'Duplicating...' : 'Duplicate'}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
        <Card className="border-white/10 bg-card/70">
          <CardHeader>
            <CardTitle className="text-white">No Meal Plans Yet</CardTitle>
            <CardDescription>
              Create your first meal plan to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/meal-planner/new">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Create Your First Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
