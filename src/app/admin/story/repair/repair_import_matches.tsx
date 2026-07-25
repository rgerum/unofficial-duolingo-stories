"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Spinner, SpinnerBlue } from "@/components/ui/spinner";

function parseOptionalNumber(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function courseLabel(course: {
  id: number;
  short: string | null;
  learning_language: number;
  from_language: number;
  name: string | null;
}) {
  const short = course.short?.trim() || "no-short";
  const name = course.name?.trim();
  return name
    ? `${short} · #${course.id} · ${name}`
    : `${short} · #${course.id}`;
}

function sourceOptionLabel(story: {
  id: number;
  name: string;
  setId: number | null;
  setIndex: number | null;
}) {
  const setPart = `${String(story.setId ?? 0).padStart(2, "0")}-${String(
    story.setIndex ?? 0,
  ).padStart(2, "0")}`;
  return `${setPart} · ${story.id} · ${story.name}`;
}

function statusBadgeClassName(status: string) {
  if (status === "mismatch") {
    return "bg-[color:color-mix(in_srgb,#f59e0b_18%,transparent)] text-[#9a6700]";
  }
  if (status === "ambiguous") {
    return "bg-[color:color-mix(in_srgb,#ef4444_18%,transparent)] text-[#9b1c1c]";
  }
  if (status === "missing") {
    return "bg-[color:color-mix(in_srgb,#3b82f6_16%,transparent)] text-[#1d4ed8]";
  }
  return "bg-[color:color-mix(in_srgb,#10b981_16%,transparent)] text-[#047857]";
}

export default function RepairImportMatches() {
  const coursesData = useQuery(api.adminData.getAdminCourses, {});
  const repairMutation = useMutation(
    api.adminStoryWrite.repairImportedStoryMatch,
  );

  const [sourceCourseId, setSourceCourseId] = useState<number | null>(null);
  const [targetCourseId, setTargetCourseId] = useState<number | null>(null);
  const [sourceQuery, setSourceQuery] = useState("es-en");
  const [targetQuery, setTargetQuery] = useState("");
  const [showOnlySuspicious, setShowOnlySuspicious] = useState(true);
  const [selectedSourceByTargetId, setSelectedSourceByTargetId] = useState<
    Record<number, number>
  >({});
  const [savingTargetId, setSavingTargetId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sourceCourses = useMemo(
    () => coursesData?.courses.filter((course) => course.official) ?? [],
    [coursesData],
  );

  const targetCourses = useMemo(
    () => coursesData?.courses.filter((course) => !course.official) ?? [],
    [coursesData],
  );

  const filteredSourceCourses = useMemo(() => {
    const query = sourceQuery.trim().toLowerCase();
    if (!query) return sourceCourses;
    return sourceCourses.filter((course) => {
      const short = course.short?.toLowerCase() ?? "";
      const name = course.name?.toLowerCase() ?? "";
      return (
        short.includes(query) ||
        name.includes(query) ||
        String(course.id).includes(query)
      );
    });
  }, [sourceCourses, sourceQuery]);

  const filteredTargetCourses = useMemo(() => {
    const query = targetQuery.trim().toLowerCase();
    if (!query) return targetCourses;
    return targetCourses.filter((course) => {
      const short = course.short?.toLowerCase() ?? "";
      const name = course.name?.toLowerCase() ?? "";
      return (
        short.includes(query) ||
        name.includes(query) ||
        String(course.id).includes(query)
      );
    });
  }, [targetCourses, targetQuery]);

  useEffect(() => {
    if (sourceCourses.length === 0 && targetCourses.length === 0) return;
    if (sourceCourseId === null) {
      const defaultSource =
        sourceCourses.find((course) => course.short === "es-en") ??
        sourceCourses[0] ??
        null;
      setSourceCourseId(defaultSource?.id ?? null);
    }
    if (targetCourseId === null) {
      setTargetCourseId(targetCourses[0]?.id ?? null);
    }
  }, [sourceCourses, targetCourses, sourceCourseId, targetCourseId]);

  const repairData = useQuery(
    api.adminData.getAdminStoryImportRepairData,
    sourceCourseId !== null &&
      targetCourseId !== null &&
      sourceCourseId !== targetCourseId
      ? {
          sourceCourseLegacyId: sourceCourseId,
          targetCourseLegacyId: targetCourseId,
        }
      : "skip",
  );

  useEffect(() => {
    if (!repairData) return;
    const nextSelections: Record<number, number> = {};
    for (const row of repairData.rows) {
      const preferredSourceId =
        row.suggestedSourceStoryId ?? row.currentSourceStoryId;
      if (preferredSourceId !== null) {
        nextSelections[row.targetStoryId] = preferredSourceId;
      }
    }
    setSelectedSourceByTargetId(nextSelections);
  }, [repairData]);

  const visibleRows = useMemo(() => {
    if (!repairData) return [];
    if (!showOnlySuspicious) return repairData.rows;
    return repairData.rows.filter((row) => row.status !== "matched");
  }, [repairData, showOnlySuspicious]);

  const selectedSourceCourse =
    sourceCourses.find((course) => course.id === sourceCourseId) ?? null;
  const selectedTargetCourse =
    targetCourses.find((course) => course.id === targetCourseId) ?? null;

  if (coursesData === undefined) {
    return (
      <div className="mx-auto my-6 mb-10 w-[min(1240px,calc(100vw-32px))]">
        <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-5 shadow-[0_16px_38px_color-mix(in_srgb,#000_14%,transparent)]">
          <Spinner />
        </div>
      </div>
    );
  }

  if (sourceCourses.length === 0 && targetCourses.length === 0) {
    return (
      <div className="mx-auto my-6 mb-10 w-[min(1240px,calc(100vw-32px))]">
        <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-5 shadow-[0_16px_38px_color-mix(in_srgb,#000_14%,transparent)]">
          No courses available for repair.
        </div>
      </div>
    );
  }

  async function saveRepair(targetStoryId: number) {
    const sourceStoryId = selectedSourceByTargetId[targetStoryId];
    if (!sourceStoryId) return;

    setSavingTargetId(targetStoryId);
    setErrorMessage(null);
    try {
      await repairMutation({
        targetLegacyStoryId: targetStoryId,
        sourceLegacyStoryId: sourceStoryId,
        sourceCourseLegacyId: sourceCourseId ?? undefined,
        targetCourseLegacyId: targetCourseId ?? undefined,
        operationKey: `story:${targetStoryId}:admin_repair_import:${sourceStoryId}`,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save repair.",
      );
    } finally {
      setSavingTargetId(null);
    }
  }

  return (
    <div className="mx-auto my-6 mb-10 w-[min(1240px,calc(100vw-32px))]">
      <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-5 shadow-[0_16px_38px_color-mix(in_srgb,#000_14%,transparent)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="m-0 text-[1.6rem] leading-[1.2]">
              Repair Imported Story Matches
            </h1>
            <p className="mt-2 mb-0 max-w-[820px] text-[var(--text-color-dim)]">
              This updates the target story metadata to the selected source
              story so the existing golden import logic matches again. Story
              text and translations stay unchanged.
            </p>
          </div>
          <Link
            className="whitespace-nowrap underline underline-offset-2"
            href="/admin/story"
          >
            Back to Story Search
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="grid gap-1">
            <span className="font-bold">Source course</span>
            <Input
              placeholder="Search official source courses"
              value={sourceQuery}
              onChange={(event) => setSourceQuery(event.target.value)}
            />
            <select
              className="w-full rounded-[16px] border-2 border-[var(--input-border)] bg-[var(--input-background)] px-[17px] py-[10px] text-[var(--text-color)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--link-blue)_45%,var(--input-border))] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--link-blue)_12%,transparent)]"
              value={sourceCourseId ?? ""}
              onChange={(event) =>
                setSourceCourseId(parseOptionalNumber(event.target.value))
              }
            >
              {filteredSourceCourses.length === 0 ? (
                <option value="">No matching official source courses</option>
              ) : (
                filteredSourceCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {courseLabel(course)}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="font-bold">Target course</span>
            <Input
              placeholder="Search target courses"
              value={targetQuery}
              onChange={(event) => setTargetQuery(event.target.value)}
            />
            <select
              className="w-full rounded-[16px] border-2 border-[var(--input-border)] bg-[var(--input-background)] px-[17px] py-[10px] text-[var(--text-color)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--link-blue)_45%,var(--input-border))] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--link-blue)_12%,transparent)]"
              value={targetCourseId ?? ""}
              onChange={(event) =>
                setTargetCourseId(parseOptionalNumber(event.target.value))
              }
            >
              {filteredTargetCourses.length === 0 ? (
                <option value="">No matching target courses</option>
              ) : (
                filteredTargetCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {courseLabel(course)}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="flex items-end gap-2 pb-2">
            <input
              checked={showOnlySuspicious}
              type="checkbox"
              onChange={(event) => setShowOnlySuspicious(event.target.checked)}
            />
            <span>Only suspicious rows</span>
          </label>
        </div>

        {sourceCourseId === targetCourseId ? (
          <p className="mt-4 text-[#9b1c1c]">
            Source and target course must be different.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--text-color-dim)]">
          <span>
            Source:{" "}
            {selectedSourceCourse ? courseLabel(selectedSourceCourse) : "-"}
          </span>
          <span>
            Target:{" "}
            {selectedTargetCourse ? courseLabel(selectedTargetCourse) : "-"}
          </span>
        </div>

        {errorMessage ? (
          <p className="mt-4 text-[#9b1c1c]">{errorMessage}</p>
        ) : null}

        {repairData === undefined &&
        sourceCourseId !== null &&
        targetCourseId !== null &&
        sourceCourseId !== targetCourseId ? (
          <Spinner />
        ) : null}

        {repairData && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--text-color-dim)]">
              <span>{repairData.rows.length} target stories loaded</span>
              <span>{visibleRows.length} rows shown</span>
              <span>
                {repairData.sourceStories.length} source stories available
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left [&_th]:border-b [&_th]:border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] [&_th]:px-3 [&_th]:py-2 [&_td]:border-b [&_td]:border-[color:color-mix(in_srgb,var(--header-border)_45%,transparent)] [&_td]:px-3 [&_td]:py-3">
                <thead>
                  <tr>
                    <th>Target story</th>
                    <th>Current match</th>
                    <th>Suggested match</th>
                    <th>Reason</th>
                    <th>Assign source</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-[var(--text-color-dim)]"
                      >
                        No rows match the current filter.
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((row) => {
                      const selectedSourceId =
                        selectedSourceByTargetId[row.targetStoryId] ?? "";
                      const hasSelection = typeof selectedSourceId === "number";
                      const isSaving = savingTargetId === row.targetStoryId;
                      return (
                        <tr key={row.targetStoryId}>
                          <td className="align-top">
                            <div className="font-bold">{row.targetName}</div>
                            <div className="mt-1 text-sm text-[var(--text-color-dim)]">
                              #{row.targetStoryId} · set{" "}
                              {String(row.targetSetId ?? 0).padStart(2, "0")}-
                              {String(row.targetSetIndex ?? 0).padStart(2, "0")}
                            </div>
                            <div className="mt-1 text-xs text-[var(--text-color-dim)]">
                              duo_id: {row.targetDuoId ?? "none"}
                            </div>
                            <div className="mt-2">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase ${statusBadgeClassName(
                                  row.status,
                                )}`}
                              >
                                {row.status}
                              </span>
                            </div>
                          </td>
                          <td className="align-top">
                            {row.currentSourceStoryId ? (
                              <>
                                <div className="font-bold">
                                  #{row.currentSourceStoryId}
                                </div>
                                <div>{row.currentSourceStoryName}</div>
                              </>
                            ) : (
                              <span className="text-[var(--text-color-dim)]">
                                No unique current match
                              </span>
                            )}
                          </td>
                          <td className="align-top">
                            {row.suggestedSourceStoryId ? (
                              <>
                                <div className="font-bold">
                                  #{row.suggestedSourceStoryId}
                                </div>
                                <div>{row.suggestedSourceStoryName}</div>
                              </>
                            ) : (
                              <span className="text-[var(--text-color-dim)]">
                                No automatic suggestion
                              </span>
                            )}
                          </td>
                          <td className="align-top text-sm text-[var(--text-color-dim)]">
                            {row.suggestionReason}
                          </td>
                          <td className="align-top">
                            <select
                              className="w-full rounded-[14px] border border-[var(--input-border)] bg-[var(--input-background)] px-3 py-2 text-sm"
                              value={selectedSourceId}
                              onChange={(event) =>
                                setSelectedSourceByTargetId((current) => {
                                  const nextValue = parseOptionalNumber(
                                    event.target.value,
                                  );
                                  if (nextValue === null) {
                                    const nextState = { ...current };
                                    delete nextState[row.targetStoryId];
                                    return nextState;
                                  }
                                  return {
                                    ...current,
                                    [row.targetStoryId]: nextValue,
                                  };
                                })
                              }
                            >
                              <option value="">Select source story</option>
                              {repairData.sourceStories.map((story) => (
                                <option key={story.id} value={story.id}>
                                  {sourceOptionLabel(story)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="align-top">
                            <Button
                              size="sm"
                              disabled={!hasSelection || isSaving}
                              onClick={() => void saveRepair(row.targetStoryId)}
                            >
                              {isSaving ? (
                                <span className="inline-flex items-center gap-2">
                                  Saving <SpinnerBlue />
                                </span>
                              ) : (
                                "Apply"
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
