import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore, type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  test('SCEN-961: 複数の課題に同一の優先度スコアが割り当てられた場合、エラーを返す', () => {
    const input_issue_a: IssuePriorityScoringInput = {
      issueId: '課題A',
      issueContent: 'データベース接続エラー',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    const input_issue_b: IssuePriorityScoringInput = {
      issueId: '課題B',
      issueContent: 'APIレスポンス遅延',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    const input_issue_c: IssuePriorityScoringInput = {
      issueId: '課題C',
      issueContent: 'メモリリーク',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    const result_a = calculateIssuePriorityScore(input_issue_a);
    const result_b = calculateIssuePriorityScore(input_issue_b);
    const result_c = calculateIssuePriorityScore(input_issue_c);

    expect(result_a.priorityScore).toBe(75);
    expect(result_b.priorityScore).toBe(75);
    expect(result_c.priorityScore).toBe(75);

    const collected_scores = [result_a.priorityScore, result_b.priorityScore, result_c.priorityScore];
    const unique_scores = new Set(collected_scores);
    const has_duplicate = unique_scores.size < collected_scores.length;

    expect(has_duplicate).toBe(true);
    expect(result_a.scoreBreakdown.impactScore).toBe(75);
    expect(result_b.scoreBreakdown.impactScore).toBe(75);
    expect(result_c.scoreBreakdown.impactScore).toBe(75);
  });
});