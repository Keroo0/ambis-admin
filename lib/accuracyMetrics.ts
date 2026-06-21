export type AccuracyAttemptType = 'genuine' | 'impostor' | string;

export interface AccuracyLogRow {
  attempt_type: AccuracyAttemptType | null;
  face_match_score: number | null;
  passed: boolean | null;
  liveness_verified: boolean | null;
}

export interface AccuracyMetrics {
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  averageScorePercent: number | null;
  successRatePercent: number;
  livenessRatePercent: number;
  falseRejectRatePercent: number;
  falseAcceptRatePercent: number;
}

function percent(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

export function computeAccuracyMetrics(rows: AccuracyLogRow[]): AccuracyMetrics {
  const totalAttempts = rows.length;
  const passedAttempts = rows.filter((row) => row.passed === true).length;
  const failedAttempts = rows.filter((row) => row.passed === false).length;
  const livenessPassed = rows.filter((row) => row.liveness_verified === true).length;

  const scoredRows = rows.filter(
    (row): row is AccuracyLogRow & { face_match_score: number } =>
      typeof row.face_match_score === 'number' && Number.isFinite(row.face_match_score),
  );
  const averageScorePercent =
    scoredRows.length === 0
      ? null
      : Number(
          (
            (scoredRows.reduce((sum, row) => sum + row.face_match_score, 0) /
              scoredRows.length) *
            100
          ).toFixed(1),
        );

  const genuineRows = rows.filter((row) => row.attempt_type === 'genuine');
  const impostorRows = rows.filter((row) => row.attempt_type === 'impostor');
  const falseRejects = genuineRows.filter((row) => row.passed === false).length;
  const falseAccepts = impostorRows.filter((row) => row.passed === true).length;

  return {
    totalAttempts,
    passedAttempts,
    failedAttempts,
    averageScorePercent,
    successRatePercent: percent(passedAttempts, totalAttempts),
    livenessRatePercent: percent(livenessPassed, totalAttempts),
    falseRejectRatePercent: percent(falseRejects, genuineRows.length),
    falseAcceptRatePercent: percent(falseAccepts, impostorRows.length),
  };
}
