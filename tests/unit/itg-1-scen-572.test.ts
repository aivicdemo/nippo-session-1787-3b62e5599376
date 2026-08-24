import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度判定機能 - 影響度スコア計算', () => {
  // SCEN-572
  test('課題内容がnullのとき影響度スコア計算エラーが発生する', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: null as any,
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 7,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/課題内容/);
  });
});