import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Dashboard Authorization', () => {
  test('SCEN-911: should throw UnauthorizedAccessException when user lacks dashboard display permission', () => {
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
      requestUserId: 'USER-NO-PERMISSION',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/ダッシュボード表示権限/);
  });
});