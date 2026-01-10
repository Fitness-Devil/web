'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InlineNotice } from '@/components/ui/inline-notice';
import { apiFetch } from '@/lib/rest-client';

type Workout = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  difficulty: string | null;
  exercises: unknown[] | null;
};

type WorkoutSummary = {
  totalWorkouts: number;
  lastWorkoutDate: string | null;
  currentStreak: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
};

type SessionInfo = {
  id: string;
  userId: string;
  workoutId: string | null;
  workoutName: string | null;
  startedAt: string;
  endedAt: string | null;
  perceivedDifficulty: string | null;
  notes: string | null;
};

type SessionsResponse = {
  sessions: SessionInfo[];
  totalCount: number;
};

export default function WorkoutsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [workoutsData, summaryData, sessionsData] = await Promise.all([
          apiFetch<Workout[]>(`/workouts/user/${session.user.id}`),
          apiFetch<WorkoutSummary>(`/workout-sessions/user/${session.user.id}/summary`),
          apiFetch<SessionsResponse>(`/workout-sessions/user/${session.user.id}`, {
            query: { limit: 5, offset: 0 },
          }),
        ]);

        setWorkouts(Array.isArray(workoutsData) ? workoutsData : []);
        setSummary(summaryData || null);
        setRecentSessions(sessionsData?.sessions || []);
      } catch (error) {
        setNotice({ type: 'error', message: (error as Error).message });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session?.user?.id]);

  const handleStartSession = async (workoutId: string) => {
    if (!session?.user?.id) {
      setNotice({ type: 'info', message: 'Sign in to start a session.' });
      return;
    }

    setStarting(workoutId);
    try {
      const data = await apiFetch<{ success: boolean; sessionId: string; message: string }>(
        '/workout-sessions/start',
        {
          method: 'POST',
          body: {
            userId: session.user.id,
            workoutId,
            startedAt: new Date().toISOString(),
          },
        }
      );

      if (data?.sessionId) {
        router.push(`/dashboard/workouts/sessions/${data.sessionId}`);
      } else {
        setNotice({ type: 'error', message: data?.message || 'Failed to start session.' });
      }
    } catch (error) {
      setNotice({ type: 'error', message: (error as Error).message });
    } finally {
      setStarting(null);
    }
  };

  const headerStats = useMemo(() => {
    if (!summary) return null;
    return [
      { label: 'Total Workouts', value: summary.totalWorkouts },
      { label: 'Current Streak', value: summary.currentStreak },
      { label: 'This Week', value: summary.workoutsThisWeek },
      { label: 'This Month', value: summary.workoutsThisMonth },
    ];
  }, [summary]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading workouts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {notice ? <InlineNotice message={notice.message} type={notice.type} /> : null}
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Workouts</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Workout Library</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your templates and jump into new workout sessions.
            </p>
          </div>
          <Link href="/dashboard/workouts/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              New Template
            </Button>
          </Link>
        </div>
      </div>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {headerStats?.map((stat) => (
            <Card key={stat.label} className="border-white/10 bg-card/80">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-[0.2em]">
                  {stat.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Your Templates</CardTitle>
            <CardDescription className="text-muted-foreground">
              Choose a template to view details or start a session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workouts.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
                No workout templates yet.
              </div>
            ) : (
              workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div>
                    <p className="text-lg font-semibold text-white">{workout.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {workout.description || 'No description'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      <span>{workout.difficulty || 'N/A'}</span>
                      <span>•</span>
                      <span>{workout.durationMinutes ?? 0} min</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/workouts/${workout.id}`}>
                      <Button variant="outline" className="border-white/10 bg-white/5 text-white">
                        View
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleStartSession(workout.id)}
                      disabled={starting === workout.id}
                    >
                      {starting === workout.id ? 'Starting...' : 'Start'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Recent Sessions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your latest workout activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSessions.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
                No sessions yet.
              </div>
            ) : (
              recentSessions.map((sessionInfo) => (
                <Link
                  key={sessionInfo.id}
                  href={`/dashboard/workouts/sessions/${sessionInfo.id}`}
                  className="block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-primary/40"
                >
                  <p className="text-sm font-semibold text-white">
                    {sessionInfo.workoutName || 'Freeform Session'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(sessionInfo.startedAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sessionInfo.endedAt ? 'Completed' : 'In progress'}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
