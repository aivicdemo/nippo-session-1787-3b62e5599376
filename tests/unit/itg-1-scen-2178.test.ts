import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Edge Case: Frequency Just Above Threshold', () => {
  // SCEN-2178
  test('should rank issue with frequency at threshold boundary (6 occurrences) higher than baseline', () => {
    const issueAboveThreshold = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウン',
      occurrenceFrequency: 6,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const issueBelowThreshold = {
      issueId: 'issue-002',
      issueContent: 'ネットワーク遅延',
      occurrenceFrequency: 5,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const resultAboveThreshold = calculateIssuePriorityScore(issueAboveThreshold);
    const resultBelowThreshold = calculateIssuePriorityScore(issueBelowThreshold);

    expect(resultAboveThreshold.priorityScore).toBe(75);
    expect(resultBelowThreshold.priorityScore).toBe(70);
    expect(resultAboveThreshold.priorityScore).toBeGreaterThan(resultBelowThreshold.priorityScore);
    expect(resultAboveThreshold.priorityRank).toBe('高');
    expect(resultBelowThreshold.priorityRank).toBe('中');
  });
});