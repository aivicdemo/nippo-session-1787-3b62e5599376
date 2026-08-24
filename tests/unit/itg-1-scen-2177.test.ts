import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-2177: [edge] 課題優先度スコア算出機能 - 発生頻度が閾値直下（例：4回）の課題は基準優先度より低く順序付けされる
  test('発生頻度が閾値直下の課題は基準値以上の課題より低いスコアで順序付けされる', () => {
    const belowThresholdInput = {
      issueId: 'issue-below-threshold-001',
      issueContent: 'DB接続エラーが頻発している状況',
      occurrenceFrequency: 4,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const atOrAboveThresholdInput = {
      issueId: 'issue-at-threshold-001',
      issueContent: 'DB接続エラーが頻発している状況',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const belowThresholdResult = calculateIssuePriorityScore(belowThresholdInput);
    const atOrAboveThresholdResult = calculateIssuePriorityScore(atOrAboveThresholdInput);

    expect(belowThresholdResult.priorityScore).toBeLessThan(atOrAboveThresholdResult.priorityScore);
    expect(belowThresholdResult.priorityScore).toBeLessThanOrEqual(35);
    expect(atOrAboveThresholdResult.priorityScore).toBeGreaterThanOrEqual(50);
  });
});