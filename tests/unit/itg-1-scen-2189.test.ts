import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  test('SCEN-2189: 同じ優先度スコアを持つ複数課題が並ぶ場合、発生頻度が同じ場合は報告日時の順序で安定ソートされる', () => {
    const input_issues = [
      {
        issueId: 'issue_a',
        issueContent: 'データベース接続エラーが発生した',
        occurrenceFrequency: 3,
        impactScore: 80,
        affectedTeamCount: 2,
        resolutionDaysAverage: 1,
        reportingDate: '2025-01-15T09:00:00Z',
        teamId: 'team_dev_001'
      },
      {
        issueId: 'issue_b',
        issueContent: 'テストケースの実行時間が長くなった',
        occurrenceFrequency: 3,
        impactScore: 80,
        affectedTeamCount: 2,
        resolutionDaysAverage: 1,
        reportingDate: '2025-01-15T09:15:00Z',
        teamId: 'team_dev_001'
      },
      {
        issueId: 'issue_c',
        issueContent: 'デプロイ手順が不明確である',
        occurrenceFrequency: 3,
        impactScore: 80,
        affectedTeamCount: 2,
        resolutionDaysAverage: 1,
        reportingDate: '2025-01-15T08:45:00Z',
        teamId: 'team_dev_001'
      }
    ];

    const result_a = calculateIssuePriorityScore(input_issues[0]);
    const result_b = calculateIssuePriorityScore(input_issues[1]);
    const result_c = calculateIssuePriorityScore(input_issues[2]);

    expect(result_a.priorityScore).toBe(75);
    expect(result_b.priorityScore).toBe(75);
    expect(result_c.priorityScore).toBe(75);

    const sorted_issues = [
      { result: result_a, reporting_date: '2025-01-15T09:00:00Z' },
      { result: result_b, reporting_date: '2025-01-15T09:15:00Z' },
      { result: result_c, reporting_date: '2025-01-15T08:45:00Z' }
    ].sort((a, b) => {
      if (a.result.priorityScore !== b.result.priorityScore) {
        return b.result.priorityScore - a.result.priorityScore;
      }
      return new Date(a.reporting_date).getTime() - new Date(b.reporting_date).getTime();
    });

    expect(sorted_issues[0].reporting_date).toBe('2025-01-15T08:45:00Z');
    expect(sorted_issues[1].reporting_date).toBe('2025-01-15T09:00:00Z');
    expect(sorted_issues[2].reporting_date).toBe('2025-01-15T09:15:00Z');
  });
});