import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能', () => {
  // SCEN-934: [normal] 課題優先度スコア計算・色分け表示機能 - 優先度スコア70以上の課題に赤色ラベルを付与する
  test('優先度スコア70以上の課題に赤色ラベルを付与し、スコア70未満には赤色を付与しない', () => {
    const issue_a: Parameters<typeof calculateIssuePriorityScore>[0] = {
      issueId: 'issue-a-001',
      issueContent: 'データベース接続エラーが頻発',
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const issue_b: Parameters<typeof calculateIssuePriorityScore>[0] = {
      issueId: 'issue-b-002',
      issueContent: 'API応答遅延の問題',
      occurrenceFrequency: 6,
      impactScore: 80,
      affectedTeamCount: 4,
      resolutionDaysAverage: 3.0,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const issue_c: Parameters<typeof calculateIssuePriorityScore>[0] = {
      issueId: 'issue-c-003',
      issueContent: 'ドキュメント記述漏れ',
      occurrenceFrequency: 2,
      impactScore: 40,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1.0,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const issue_d: Parameters<typeof calculateIssuePriorityScore>[0] = {
      issueId: 'issue-d-004',
      issueContent: 'システム障害による本番環境停止',
      occurrenceFrequency: 12,
      impactScore: 95,
      affectedTeamCount: 5,
      resolutionDaysAverage: 4.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const result_a = calculateIssuePriorityScore(issue_a);
    const result_b = calculateIssuePriorityScore(issue_b);
    const result_c = calculateIssuePriorityScore(issue_c);
    const result_d = calculateIssuePriorityScore(issue_d);

    expect(result_a.priorityScore).toBe(70);
    expect(result_a.colorCode).toBe('#FF0000');
    expect(result_a.priorityRank).toBe('高');

    expect(result_b.priorityScore).toBe(75);
    expect(result_b.colorCode).toBe('#FF0000');
    expect(result_b.priorityRank).toBe('高');

    expect(result_c.priorityScore).toBe(35);
    expect(result_c.colorCode).toBe('#00FF00');
    expect(result_c.priorityRank).toBe('低');

    expect(result_d.priorityScore).toBe(100);
    expect(result_d.colorCode).toBe('#FF0000');
    expect(result_d.priorityRank).toBe('高');
  });
});