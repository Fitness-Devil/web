'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InlineNotice } from '@/components/ui/inline-notice';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/rest-client';

type Exercise = {
  id: string;
  name: string;
  description: string | null;
  sets: number | null;
  reps: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  orderIndex: number | null;
};

type WorkoutDetail = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  difficulty: string | null;
  exercises: Exercise[] | null;
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

type LibraryExercise = {
  id: string;
  name: string;
  description: string | null;
};

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const workoutId = params.id as string;
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [addingExercise, setAddingExercise] = useState(false);
  const [libraryExercises, setLibraryExercises] = useState<LibraryExercise[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    description: '',
    sets: '',
    reps: '',
    durationSeconds: '',
    restSeconds: '',
    libraryExerciseId: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [workoutData, sessionsData] = await Promise.all([
          apiFetch<WorkoutDetail>(`/workouts/${workoutId}`),
          apiFetch<SessionsResponse>(`/workout-sessions/template/${workoutId}`, {
            query: { limit: 10 },
          }),
        ]);

        setWorkout(workoutData);
        setSessions(sessionsData?.sessions || []);
      } catch (error) {
        setNotice({ type: 'error', message: (error as Error).message });
      } finally {
        setLoading(false);
      }
    };

    if (workoutId) {
      load();
    }
  }, [workoutId]);

  useEffect(() => {
    const loadLibrary = async () => {
      if (!session?.user?.id) return;
      try {
        if (librarySearch) {
          const data = await apiFetch<LibraryExercise[]>(
            '/v1/exercise-library/search',
            {
              query: {
                query: librarySearch,
                userId: session.user.id,
              },
            }
          );
          setLibraryExercises(data || []);
          return;
        }
        const data = await apiFetch<LibraryExercise[]>(
          `/v1/exercise-library/available/${session.user.id}`
        );
        setLibraryExercises(data || []);
      } catch (error) {
        setNotice({ type: 'error', message: (error as Error).message });
      }
    };

    loadLibrary();
  }, [librarySearch, session?.user?.id]);

  useEffect(() => {
    if (!selectedLibraryId) {
      setExerciseForm((prev) => ({ ...prev, libraryExerciseId: '' }));
      return;
    }
    const selected = libraryExercises.find((item) => item.id === selectedLibraryId);
    if (!selected) {
      return;
    }
    setExerciseForm((prev) => ({
      ...prev,
      name: selected.name,
      description: selected.description || '',
      libraryExerciseId: selected.id,
    }));
  }, [selectedLibraryId, libraryExercises]);

  const handleStartSession = async () => {
    if (!session?.user?.id) {
      setNotice({ type: 'info', message: 'Sign in to start a session.' });
      return;
    }

    setStarting(true);
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
      setStarting(false);
    }
  };

  const handleAddExercise = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!exerciseForm.name) {
      setNotice({ type: 'info', message: 'Exercise name is required.' });
      return;
    }

    setAddingExercise(true);
    try {
      await apiFetch(`/workouts/${workoutId}/exercises`, {
        method: 'POST',
        body: {
          name: exerciseForm.name,
          description: exerciseForm.description || null,
          sets: exerciseForm.sets ? Number(exerciseForm.sets) : null,
          reps: exerciseForm.reps ? Number(exerciseForm.reps) : null,
          durationSeconds: exerciseForm.durationSeconds ? Number(exerciseForm.durationSeconds) : null,
          restSeconds: exerciseForm.restSeconds ? Number(exerciseForm.restSeconds) : null,
          orderIndex: exercises.length,
          libraryExerciseId: exerciseForm.libraryExerciseId || null,
        },
      });
      setExerciseForm({
        name: '',
        description: '',
        sets: '',
        reps: '',
        durationSeconds: '',
        restSeconds: '',
        libraryExerciseId: '',
      });
      const workoutData = await apiFetch<WorkoutDetail>(`/workouts/${workoutId}`);
      setWorkout(workoutData);
    } catch (error) {
      setNotice({ type: 'error', message: (error as Error).message });
    } finally {
      setAddingExercise(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading workout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Workout Not Found</CardTitle>
            <CardDescription className="text-destructive">
              {notice?.message || 'Unable to load workout details.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/workouts">
              <Button variant="outline" className="border-white/10 bg-white/5 text-white">
                Back to Workouts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exercises = workout.exercises || [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {notice ? <InlineNotice message={notice.message} type={notice.type} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/workouts">
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white">
              ← Back to Workouts
            </Button>
          </Link>
          <p className="mt-5 text-xs uppercase tracking-[0.4em] text-muted-foreground">Workout</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{workout.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {workout.description || 'No description provided.'}
          </p>
        </div>
        <Button onClick={handleStartSession} disabled={starting}>
          {starting ? 'Starting...' : 'Start Session'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Exercise Plan</CardTitle>
            <CardDescription className="text-muted-foreground">
              {exercises.length} exercises configured.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exercises.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
                No exercises added yet.
              </div>
            ) : (
              exercises
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .map((exercise) => (
                  <div
                    key={exercise.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{exercise.name}</p>
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        #{(exercise.orderIndex ?? 0) + 1}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {exercise.description || 'No notes.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      <span>{exercise.sets ?? 0} sets</span>
                      <span>{exercise.reps ?? 0} reps</span>
                      <span>{exercise.durationSeconds ?? 0}s</span>
                      <span>{exercise.restSeconds ?? 0}s rest</span>
                    </div>
                  </div>
                ))
            )}

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Add Exercise</p>
              <form className="mt-3 space-y-3" onSubmit={handleAddExercise}>
                <Input
                  placeholder="Search library"
                  value={librarySearch}
                  onChange={(event) => setLibrarySearch(event.target.value)}
                />
                <Select value={selectedLibraryId} onValueChange={setSelectedLibraryId}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Select library exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {libraryExercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Exercise name"
                  value={exerciseForm.name}
                  onChange={(event) => setExerciseForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
                <Input
                  placeholder="Description"
                  value={exerciseForm.description}
                  onChange={(event) => setExerciseForm((prev) => ({ ...prev, description: event.target.value }))}
                />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    placeholder="Sets"
                    value={exerciseForm.sets}
                    onChange={(event) => setExerciseForm((prev) => ({ ...prev, sets: event.target.value }))}
                  />
                  <Input
                    placeholder="Reps"
                    value={exerciseForm.reps}
                    onChange={(event) => setExerciseForm((prev) => ({ ...prev, reps: event.target.value }))}
                  />
                  <Input
                    placeholder="Duration (sec)"
                    value={exerciseForm.durationSeconds}
                    onChange={(event) =>
                      setExerciseForm((prev) => ({ ...prev, durationSeconds: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Rest (sec)"
                    value={exerciseForm.restSeconds}
                    onChange={(event) => setExerciseForm((prev) => ({ ...prev, restSeconds: event.target.value }))}
                  />
                </div>
                <Button type="submit" disabled={addingExercise}>
                  {addingExercise ? 'Adding...' : 'Add Exercise'}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Template Sessions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Recent history for this template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessions.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
                No sessions yet.
              </div>
            ) : (
              sessions.map((sessionInfo) => (
                <Link
                  key={sessionInfo.id}
                  href={`/dashboard/workouts/sessions/${sessionInfo.id}`}
                  className="block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-primary/40"
                >
                  <p className="text-sm font-semibold text-white">
                    {sessionInfo.workoutName || 'Workout Session'}
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
