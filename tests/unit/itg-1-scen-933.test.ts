import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-933
  test('課題が複数件のとき、全課題の優先度スコアを計算してスコア降順で返す', () => {
    const issuesInput = [
      {
        issueId: 'issue-001',
        issueContent: 'データベース接続エラーが頻発',
        occurrenceFrequency: 8,
        impactScore: 65,
        affectedTeamCount: 3,
        resolutionDaysAverage: 2.5,
        reportingDate: '2024-01-15',
        teamId: 'team-dev-001',
      },
      {
        issueId: 'issue-002',
        issueContent: 'API認証タイムアウト',
        occurrenceFrequency: 12,
        impactScore: 80,
        affectedTeamCount: 5,
        resolutionDaysAverage: 3.0,
        reportingDate: '2024-01-15',
        teamId: 'team-dev-001',
      },
      {
        issueId: 'issue-003',
        issueContent: 'ログファイルサイズ増大',
        occurrenceFrequency: 5,
        impactScore: 45,
        affectedTeamCount: 2,
        resolutionDaysAverage: 1.0,
        reportingDate: '2024-01-15',
        teamId: 'team-dev-001',
      },
    ];

    const result = calculateIssuePriorityScore(issuesInput);

    expect(result).toBeDefined();
    expect(result.length).toBe(3);

    // 期待値の計算：
    // 課題1：優先度スコア = 8 × 10 + 65 = 145
    // 課題2：優先度スコア = 12 × 10 + 80 = 200
    // 課題3：優先度スコア = 5 × 10 + 45 = 95
    // 降順: 課題2(200) > 課題1(145) > 課題3(95)

    expect(result[0].issueId).toBe('issue-002');
    expect(result[0].priorityScore).toBe(200);
    expect(result[0].priorityRank).toBe('高');
    expect(result[0].scoreBreakdown.frequencyScore).toBe(120);
    expect(result[0].scoreBreakdown.impactScore).toBe(80);
    expect(result[0].scoreBreakdown.resolutionDifficultyScore).toBe(0);
    expect(result[0].colorCode).toBe('#FF0000');

    expect(result[1].issueId).toBe('issue-001');
    expect(result[1].priorityScore).toBe(145);
    expect(result[1].priorityRank).toBe('高');
    expect(result[1].scoreBreakdown.frequencyScore).toBe(80);
    expect(result[1].scoreBreakdown.impactScore).toBe(65);
    expect(result[1].scoreBreakdown.resolutionDifficultyScore).toBe(0);
    expect(result[1].colorCode).toBe('#FF0000');

    expect(result[2].issueId).toBe('issue-003');
    expect(result[2].priorityScore).toBe(95);
    expect(result[2].priorityRank).toBe('低');
    expect(result[2].scoreBreakdown.frequencyScore).toBe(50);
    expect(result[2].scoreBreakdown.impactScore).toBe(45);
    expect(result[2].scoreBreakdown.resolutionDifficultyScore).toBe(0);
    expect(result[2].colorCode).toBe('#00FF00');

    // 降順ソートが保証されていることを確認
    expect(result[0].priorityScore).toBeGreaterThan(result[1].priorityScore);
    expect(result[1].priorityScore).toBeGreaterThan(result[2].priorityScore);

    // 計算実行日時が記録されていることを確認
    expect(result[0].calculatedAt).toBeDefined();
    expect(typeof result[0].calculatedAt).toBe('string');
  });
});