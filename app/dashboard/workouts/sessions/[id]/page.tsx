'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineNotice } from '@/components/ui/inline-notice';
import { apiFetch } from '@/lib/rest-client';

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

type SetDetail = {
  id: string;
  setIndex: number;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  createdAt: string;
};

type LoggedExercise = {
  id: string;
  sessionId: string;
  exerciseId: string | null;
  name: string;
  orderIndex: number;
  sets: number | null;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  notes: string | null;
  setDetails: SetDetail[];
  createdAt: string;
};

type SessionDetail = {
  session: SessionInfo;
  exercises: LoggedExercise[];
};

type IdResponse = {
  success: boolean;
  id: string;
  message: string;
};

type PendingSet = {
  id: string;
  setId: string | null;
  setIndex: string;
  reps: string;
  weightKg: string;
  durationSeconds: string;
  restSeconds: string;
};

type TemplateExercise = {
  id: string;
  name: string;
  description: string | null;
  sets: number | null;
  reps: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  orderIndex: number | null;
};

type WorkoutTemplate = {
  id: string;
  name: string;
  exercises: TemplateExercise[] | null;
};

type ReportDetail = {
  id: string;
  sessionId: string;
  userId: string;
  generatedAt: string;
  summaryJson: string;
  pbsJson: string;
};

const difficultyOptions = ['EASY', 'MODERATE', 'HARD', 'VERY_HARD'] as const;

export default function WorkoutSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );
  const [ending, setEnding] = useState(false);
  const [savingLogs, setSavingLogs] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [endDifficulty, setEndDifficulty] = useState<string>('MODERATE');
  const [endNotes, setEndNotes] = useState('');
  const [pendingSets, setPendingSets] = useState<Record<string, PendingSet[]>>({});

  const loadSession = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<SessionDetail>(`/workout-sessions/${sessionId}`);
      setSessionDetail(data);
      if (data?.session?.workoutId) {
        try {
          const templateData = await apiFetch<WorkoutTemplate>(
            `/workouts/${data.session.workoutId}`
          );
          setTemplate(templateData);
        } catch (error) {
          setTemplate(null);
        }
      } else {
        setTemplate(null);
      }
    } catch (error) {
      setNotice({ type: 'error', message: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const handleEndSession = async () => {
    setEnding(true);
    try {
      await saveLogs({ silent: true, reload: false });
      await apiFetch(`/workout-sessions/${sessionId}/end`, {
        method: 'POST',
        body: {
          endedAt: new Date().toISOString(),
          perceivedDifficulty: endDifficulty,
          notes: endNotes || null,
        },
      });
      await loadSession();
      setNotice({ type: 'success', message: 'Session completed.' });
    } catch (error) {
      setNotice({ type: 'error', message: (error as Error).message });
    } finally {
      setEnding(false);
    }
  };

  const handleAddSetRow = (templateExercise: TemplateExercise, loggedExercise?: LoggedExercise | null) => {
    const key = templateExercise.id;
    const existingRows = pendingSets[key] || [];
    const loggedRows = loggedExercise?.setDetails?.length || 0;
    const nextIndex = loggedRows + existingRows.length + 1;
    const newRow: PendingSet = {
      id: `${Date.now()}-${Math.random()}`,
      setId: null,
      setIndex: String(nextIndex),
      reps: templateExercise.reps ? String(templateExercise.reps) : '',
      weightKg: '',
      durationSeconds: '',
      restSeconds: '',
    };
    setPendingSets((prev) => ({
      ...prev,
      [key]: [...existingRows, newRow],
    }));
  };

  const updatePendingSet = (exerciseId: string, setId: string, patch: Partial<PendingSet>) => {
    setPendingSets((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] || []).map((row) =>
        row.id === setId ? { ...row, ...patch } : row
      ),
    }));
  };

  const saveLogs = async (options?: { silent?: boolean; reload?: boolean }) => {
    if (!sessionDetail?.session) {
      return false;
    }

    setSavingLogs(true);
    try {
      const loggedByExerciseId = new Map(
        (sessionDetail.exercises || [])
          .filter((exercise) => exercise.exerciseId)
          .map((exercise) => [exercise.exerciseId as string, exercise])
      );
      const loggedByName = new Map(
        (sessionDetail.exercises || []).map((exercise) => [exercise.name.toLowerCase(), exercise])
      );

      for (const templateExercise of templateExercises) {
        const rows = pendingSets[templateExercise.id] || [];
        const existingLogged =
          loggedByExerciseId.get(templateExercise.id) ||
          loggedByName.get(templateExercise.name.toLowerCase());
        let loggedExerciseId = existingLogged?.id || '';

        if (!loggedExerciseId) {
          const created = await apiFetch<IdResponse>(`/workout-exercises/session/${sessionId}`, {
            method: 'POST',
            body: {
              exerciseId: templateExercise.id,
              name: templateExercise.name,
              orderIndex: templateExercise.orderIndex ?? 0,
              sets: rows.length || templateExercise.sets || 1,
              reps: templateExercise.reps ?? null,
              durationSeconds: templateExercise.durationSeconds ?? null,
              restSeconds: templateExercise.restSeconds ?? null,
              notes: templateExercise.description || null,
            },
          });
          loggedExerciseId = created?.id || '';
        } else {
          await apiFetch(`/workout-exercises/${loggedExerciseId}`, {
            method: 'PUT',
            body: {
              sets: rows.length || templateExercise.sets || 1,
              reps: rows[0]?.reps ? Number(rows[0].reps) : templateExercise.reps ?? null,
              durationSeconds: templateExercise.durationSeconds ?? null,
              restSeconds: templateExercise.restSeconds ?? null,
              notes: templateExercise.description || null,
            },
          });
        }

        if (!loggedExerciseId) {
          continue;
        }

        for (const row of rows) {
          if (row.setId) {
            await apiFetch(`/workout-exercises/sets/${row.setId}`, {
              method: 'PUT',
              body: {
                reps: row.reps ? Number(row.reps) : null,
                weightKg: row.weightKg ? Number(row.weightKg) : null,
                durationSeconds: row.durationSeconds ? Number(row.durationSeconds) : null,
                restSeconds: row.restSeconds ? Number(row.restSeconds) : null,
              },
            });
          } else {
            await apiFetch(`/workout-exercises/${loggedExerciseId}/sets`, {
              method: 'POST',
              body: {
                setIndex: Number(row.setIndex),
                reps: row.reps ? Number(row.reps) : null,
                weightKg: row.weightKg ? Number(row.weightKg) : null,
                durationSeconds: row.durationSeconds ? Number(row.durationSeconds) : null,
                restSeconds: row.restSeconds ? Number(row.restSeconds) : null,
              },
            });
          }
        }
      }

      if (options?.reload !== false) {
        await loadSession();
      }

      if (!options?.silent) {
        setNotice({ type: 'success', message: 'Session log updated.' });
      }
      setIsEditing(false);
      return true;
    } catch (error) {
      if (!options?.silent) {
        setNotice({ type: 'error', message: (error as Error).message });
      }
      return false;
    } finally {
      setSavingLogs(false);
    }
  };

  const handleSaveLogs = async () => {
    await saveLogs();
  };

  const parseJsonSafe = (value: string | null) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const loadReport = async () => {
    if (!sessionId) {
      return;
    }
    setReportLoading(true);
    setReportError(null);
    try {
      const data = await apiFetch<ReportDetail>(`/workout-analytics/reports/session/${sessionId}`);
      setReport(data);
    } catch (error) {
      setReport(null);
      setReportError((error as Error).message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!sessionId) {
      return;
    }
    setReportLoading(true);
    setReportError(null);
    try {
      await apiFetch('/workout-analytics/reports', {
        method: 'POST',
        body: { sessionId },
      });
      await loadReport();
    } catch (error) {
      setReportError((error as Error).message);
    } finally {
      setReportLoading(false);
    }
  };

  const sessionInfo = sessionDetail?.session;
  const templateExercises = template?.exercises || [];
  const loggedExercises = sessionDetail?.exercises || [];
  const isCompleted = Boolean(sessionInfo?.endedAt);
  const loggedByExerciseId = useMemo(() => {
    const map = new Map<string, LoggedExercise>();
    const nameMap = new Map<string, LoggedExercise>();
    (sessionDetail?.exercises || []).forEach((exercise) => {
      if (exercise.exerciseId) {
        map.set(exercise.exerciseId, exercise);
      }
      nameMap.set(exercise.name.toLowerCase(), exercise);
    });
    return { byId: map, byName: nameMap };
  }, [sessionDetail?.exercises]);

  useEffect(() => {
    if (!templateExercises.length) {
      return;
    }

    setPendingSets((prev) => {
      const nextState = { ...prev };
      let changed = false;

      templateExercises.forEach((templateExercise) => {
        if (nextState[templateExercise.id]) {
          return;
        }
        const logged =
          loggedByExerciseId.byId.get(templateExercise.id) ||
          loggedByExerciseId.byName.get(templateExercise.name.toLowerCase());
        const rowsFromLogged = logged?.setDetails?.length
          ? logged.setDetails.map((set) => ({
              id: `${templateExercise.id}-${set.id}`,
              setId: set.id,
              setIndex: String(set.setIndex),
              reps: set.reps ? String(set.reps) : '',
              weightKg: set.weightKg ? String(set.weightKg) : '',
              durationSeconds: set.durationSeconds ? String(set.durationSeconds) : '',
              restSeconds: set.restSeconds ? String(set.restSeconds) : '',
            }))
          : null;

        if (rowsFromLogged && rowsFromLogged.length) {
          nextState[templateExercise.id] = rowsFromLogged;
          changed = true;
          return;
        }

        const initialCount = Math.max(1, templateExercise.sets ?? 1);
        nextState[templateExercise.id] = Array.from({ length: initialCount }).map((_, index) => ({
          id: `${templateExercise.id}-init-${index}`,
          setId: null,
          setIndex: String(index + 1),
          reps: templateExercise.reps ? String(templateExercise.reps) : '',
          weightKg: '',
          durationSeconds: '',
          restSeconds: '',
        }));
        changed = true;
      });

      return changed ? nextState : prev;
    });
  }, [templateExercises, loggedByExerciseId]);

  useEffect(() => {
    if (!sessionInfo) {
      return;
    }
    if (isCompleted) {
      setIsEditing(false);
      return;
    }
    const hasLoggedExercises = (sessionDetail?.exercises || []).length > 0;
    setIsEditing(!hasLoggedExercises);
  }, [isCompleted, sessionDetail?.exercises, sessionInfo]);

  useEffect(() => {
    if (!sessionInfo) {
      return;
    }
    setEndNotes(sessionInfo.notes || '');
    setEndDifficulty(sessionInfo.perceivedDifficulty || 'MODERATE');
  }, [sessionInfo]);

  useEffect(() => {
    if (sessionInfo) {
      loadReport();
    }
  }, [sessionInfo]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionInfo) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Session Not Found</CardTitle>
            <CardDescription className="text-destructive">
              {notice?.message || 'Unable to load session details.'}
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
          <p className="mt-5 text-xs uppercase tracking-[0.4em] text-muted-foreground">Session</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            {sessionInfo.workoutName || 'Workout Session'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Started {new Date(sessionInfo.startedAt).toLocaleString()}
          </p>
        </div>
        {!sessionInfo.endedAt ? (
          <Button onClick={handleEndSession} disabled={ending}>
            {ending ? 'Ending...' : 'End Session'}
          </Button>
        ) : (
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Completed
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Workout Template</CardTitle>
            <CardDescription className="text-muted-foreground">
              Log each planned set and track your progress.
            </CardDescription>
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 bg-white/5 text-white"
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? 'View Log' : 'Edit Log'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {templateExercises.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
                {loggedExercises.length
                  ? 'Template not available. Showing logged exercises from the session.'
                  : 'No exercises planned for this template.'}
              </div>
            ) : null}

            {templateExercises.length === 0 && loggedExercises.length > 0 ? (
              <div className="space-y-3">
                {loggedExercises
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((exercise) => (
                    <div
                      key={exercise.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{exercise.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {exercise.notes || 'No notes'}
                          </p>
                        </div>
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          #{exercise.orderIndex + 1}
                        </span>
                      </div>

                      {exercise.setDetails?.length ? (
                        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                          {exercise.setDetails.map((set) => (
                            <div
                              key={set.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                            >
                              <span>Set {set.setIndex}</span>
                              <span>{set.reps ?? 0} reps</span>
                              <span>{set.weightKg ?? 0} kg</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">No sets logged yet.</p>
                      )}
                    </div>
                  ))}
              </div>
            ) : null}

            {templateExercises.length > 0 ? (
              templateExercises
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .map((templateExercise) => {
                  const loggedExercise =
                    loggedByExerciseId.byId.get(templateExercise.id) ||
                    loggedByExerciseId.byName.get(templateExercise.name.toLowerCase());
                  const rows = pendingSets[templateExercise.id] || [];

                  return (
                    <div
                      key={templateExercise.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{templateExercise.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {templateExercise.description || 'No notes'}
                          </p>
                        </div>
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          #{(templateExercise.orderIndex ?? 0) + 1}
                        </span>
                      </div>

                      {loggedExercise?.setDetails?.length && !isEditing ? (
                        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                          {loggedExercise.setDetails.map((set) => (
                            <div
                              key={set.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                            >
                              <span>Set {set.setIndex}</span>
                              <span>{set.reps ?? 0} reps</span>
                              <span>{set.weightKg ?? 0} kg</span>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {isEditing ? (
                        <div className="mt-4 space-y-3">
                          {rows.map((row) => (
                            <div key={row.id} className="grid gap-2 md:grid-cols-6">
                              <Input
                                placeholder="Set #"
                                value={row.setIndex}
                                onChange={(event) =>
                                  updatePendingSet(templateExercise.id, row.id, { setIndex: event.target.value })
                                }
                              />
                              <Input
                                placeholder="Reps"
                                value={row.reps}
                                onChange={(event) =>
                                  updatePendingSet(templateExercise.id, row.id, { reps: event.target.value })
                                }
                              />
                              <Input
                                placeholder="Weight"
                                value={row.weightKg}
                                onChange={(event) =>
                                  updatePendingSet(templateExercise.id, row.id, { weightKg: event.target.value })
                                }
                              />
                              <Input
                                placeholder="Duration"
                                value={row.durationSeconds}
                                onChange={(event) =>
                                  updatePendingSet(templateExercise.id, row.id, { durationSeconds: event.target.value })
                                }
                              />
                              <Input
                                placeholder="Rest"
                                value={row.restSeconds}
                                onChange={(event) =>
                                  updatePendingSet(templateExercise.id, row.id, { restSeconds: event.target.value })
                                }
                              />
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 bg-white/5 text-white"
                            onClick={() => handleAddSetRow(templateExercise, loggedExercise)}
                          >
                            Add New Set
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })
            ) : null}

            {templateExercises.length > 0 && isEditing ? (
              <div className="flex justify-end">
                <Button onClick={handleSaveLogs} disabled={savingLogs}>
                  {savingLogs ? 'Saving...' : 'Save Session Log'}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-card/80">
            <CardHeader>
              <CardTitle className="text-white">Session Notes</CardTitle>
              <CardDescription className="text-muted-foreground">
                Finish your session with a quick rating and notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={endDifficulty} onValueChange={setEndDifficulty}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Session notes"
                value={endNotes}
                onChange={(event) => setEndNotes(event.target.value)}
              />
              {!sessionInfo.endedAt ? (
                <Button onClick={handleEndSession} disabled={ending}>
                  {ending ? 'Ending...' : 'End Session'}
                </Button>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                  Session ended at {new Date(sessionInfo.endedAt).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-card/80">
            <CardHeader>
              <CardTitle className="text-white">Workout Report</CardTitle>
              <CardDescription className="text-muted-foreground">
                Summary generated after your session completes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportLoading ? (
                <div className="text-sm text-muted-foreground">Loading report...</div>
              ) : report ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                    Generated {new Date(report.generatedAt).toLocaleString()}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Summary</p>
                      <div className="mt-3 space-y-2 text-sm text-white">
                        {(() => {
                          const summary = parseJsonSafe(report.summaryJson) as Record<string, any> | null;
                          if (!summary) {
                            return <p className="text-sm text-muted-foreground">Summary unavailable.</p>;
                          }
                          return (
                            <>
                              <p>Duration: {summary.durationMinutes ?? '—'} min</p>
                              <p>Total sets: {summary.totalSets ?? summary.sets ?? '—'}</p>
                              <p>Exercises: {summary.exercisesCompleted ?? summary.totalExercises ?? '—'}</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Personal Bests</p>
                      <div className="mt-3 text-sm text-white">
                        {(() => {
                          const pbs = parseJsonSafe(report.pbsJson) as Record<string, any> | null;
                          if (!pbs) {
                            return <p className="text-sm text-muted-foreground">No PB data yet.</p>;
                          }
                          if (pbs.personalBestsAchieved === false) {
                            return <p className="text-sm text-muted-foreground">No new personal bests.</p>;
                          }
                          if (pbs.count) {
                            return <p>{pbs.count} personal best(s) achieved.</p>;
                          }
                          return <p className="text-sm text-muted-foreground">PB data available.</p>;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="border-white/10 bg-white/5 text-white" onClick={loadReport}>
                      Refresh Report
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {reportError
                      ? `Report unavailable: ${reportError}`
                      : 'No report generated yet for this session.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleGenerateReport} disabled={reportLoading}>
                      Generate Report
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white"
                      onClick={loadReport}
                      disabled={reportLoading}
                    >
                      Check Again
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
