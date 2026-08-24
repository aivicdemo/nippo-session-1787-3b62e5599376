import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア計算 - 影響度スコア基づく優先度分類', () => {
  // SCEN-1344
  test('影響度スコア69は中優先度に分類されるべき', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 3,
      impactScore: 69,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.priorityRank).toBe('中');
  });
});