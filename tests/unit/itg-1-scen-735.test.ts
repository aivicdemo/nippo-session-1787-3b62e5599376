import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Team Wave Impact Integration', () => {
  // SCEN-735: [normal] 課題の自動抽出と優先度判定機能 - チーム波及度スコアが 0～100 の範囲で算出され、優先度スコアに反映される
  test('should calculate priority score correctly when team impact scores range from 0 to 100', () => {
    const test_cases = [
      {
        impact_score: 0,
        expected_priority_score: 16,
      },
      {
        impact_score: 25,
        expected_priority_score: 33,
      },
      {
        impact_score: 50,
        expected_priority_score: 50,
      },
      {
        impact_score: 75,
        expected_priority_score: 67,
      },
      {
        impact_score: 100,
        expected_priority_score: 84,
      },
    ];

    test_cases.forEach(test_case => {
      const input: IssuePriorityScoringInput = {
        issueId: 'issue-001',
        issueContent: 'データベース接続タイムアウトが発生している',
        occurrenceFrequency: 5,
        impactScore: test_case.impact_score,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
      };

      const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

      expect(result.issueId).toBe('issue-001');
      expect(result.priorityScore).toBe(test_case.expected_priority_score);
      expect(result.scoreBreakdown.impactScore).toBe(test_case.impact_score);
      expect(typeof result.priorityScore).toBe('number');
      expect(result.priorityScore).toBeGreaterThanOrEqual(1);
      expect(result.priorityScore).toBeLessThanOrEqual(100);
      expect(result.calculatedAt).toBeDefined();
    });
  });
});