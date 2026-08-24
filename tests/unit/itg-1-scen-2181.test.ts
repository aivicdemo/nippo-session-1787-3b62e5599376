import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  test('SCEN-2181: 影響度スコアが下限値ちょうど（0）の課題は最低優先度で順序付けされる', () => {
    // 入力データ: 影響度スコア0の課題
    const issueWithZeroImpact: Parameters<typeof calculateIssuePriorityScore>[0] = {
      issueId: 'issue-zero-impact',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 5,
      impactScore: 0,
      affectedTeamCount: 1,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // 入力データ: 影響度スコア50の課題
    const issueWithMediumImpact: Parameters<typeof calculateIssuePriorityScore>[0] = {
      issueId: 'issue-medium-impact',
      issueContent: 'ビルドプロセスの遅延',
      occurrenceFrequency: 5,
      impactScore: 50,
      affectedTeamCount: 1,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // 入力データ: 影響度スコア100の課題
    const issueWithHighImpact: Parameters<typeof calculateIssuePriorityScore>[0] = {
      issueId: 'issue-high-impact',
      issueContent: 'プロダクション環境での障害',
      occurrenceFrequency: 5,
      impactScore: 100,
      affectedTeamCount: 1,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // 各課題の優先度スコアを算出
    const resultZeroImpact = calculateIssuePriorityScore(issueWithZeroImpact);
    const resultMediumImpact = calculateIssuePriorityScore(issueWithMediumImpact);
    const resultHighImpact = calculateIssuePriorityScore(issueWithHighImpact);

    // 検証: 影響度0の課題の優先度スコアが、影響度50以上の全課題より小さい
    expect(resultZeroImpact.priorityScore).toBeLessThan(
      resultMediumImpact.priorityScore,
    );
    expect(resultZeroImpact.priorityScore).toBeLessThan(
      resultHighImpact.priorityScore,
    );

    // 検証: 影響度50の課題と影響度100の課題を比較
    expect(resultMediumImpact.priorityScore).toBeLessThan(
      resultHighImpact.priorityScore,
    );

    // 検証: 3つの課題をソート対象リストに含めて優先度スコアの昇順でソート
    const issues = [
      resultHighImpact,
      resultZeroImpact,
      resultMediumImpact,
    ];

    const sortedIssues = issues.sort(
      (a, b) => a.priorityScore - b.priorityScore,
    );

    // 検証: ソート結果でリストの最初（最低優先度）に配置されていること
    expect(sortedIssues[0].issueId).toBe('issue-zero-impact');
    expect(sortedIssues[0].priorityScore).toBe(
      resultZeroImpact.priorityScore,
    );
    expect(sortedIssues[sortedIssues.length - 1].issueId).toBe(
      'issue-high-impact',
    );
    expect(sortedIssues[sortedIssues.length - 1].priorityScore).toBe(
      resultHighImpact.priorityScore,
    );
  });
});