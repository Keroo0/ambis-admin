import assert from 'node:assert/strict';
import test from 'node:test';

import { computeAccuracyMetrics, type AccuracyLogRow } from './accuracyMetrics';

test('computeAccuracyMetrics returns empty thesis metrics for no rows', () => {
  const metrics = computeAccuracyMetrics([]);

  assert.equal(metrics.totalAttempts, 0);
  assert.equal(metrics.averageScorePercent, null);
  assert.equal(metrics.successRatePercent, 0);
  assert.equal(metrics.livenessRatePercent, 0);
  assert.equal(metrics.falseRejectRatePercent, 0);
  assert.equal(metrics.falseAcceptRatePercent, 0);
});

test('computeAccuracyMetrics summarizes score, success, liveness, FRR, and FAR', () => {
  const rows: AccuracyLogRow[] = [
    {
      attempt_type: 'genuine',
      face_match_score: 0.91,
      passed: true,
      liveness_verified: true,
    },
    {
      attempt_type: 'genuine',
      face_match_score: 0.63,
      passed: false,
      liveness_verified: true,
    },
    {
      attempt_type: 'impostor',
      face_match_score: 0.82,
      passed: true,
      liveness_verified: false,
    },
    {
      attempt_type: 'impostor',
      face_match_score: null,
      passed: false,
      liveness_verified: false,
    },
  ];

  const metrics = computeAccuracyMetrics(rows);

  assert.equal(metrics.totalAttempts, 4);
  assert.equal(metrics.passedAttempts, 2);
  assert.equal(metrics.failedAttempts, 2);
  assert.equal(metrics.averageScorePercent, 78.7);
  assert.equal(metrics.successRatePercent, 50);
  assert.equal(metrics.livenessRatePercent, 50);
  assert.equal(metrics.falseRejectRatePercent, 50);
  assert.equal(metrics.falseAcceptRatePercent, 50);
});
