import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア計算と優先対応リスト生成', () => {
  // SCEN-2280: [normal] 優先対応課題抽出機能 - 優先度スコアが高い課題が複数件の場合、全課題がスコアの降順で優先対応リストに含まれる
  test('複数の課題に対して優先度スコアを計算し、降順でソートされた優先対応リストを返す', () => {
    // Arrange: 複数の課題データを準備
    const issueA = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const issueB = {
      issueId: 'issue-002',
      issueContent: 'API レート制限エラー',
      occurrenceFrequency: 5,
      impactScore: 72,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const issueC = {
      issueId: 'issue-003',
      issueContent: 'メモリリーク検出',
      occurrenceFrequency: 12,
      impactScore: 90,
      affectedTeamCount: 4,
      resolutionDaysAverage: 3.0,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const issueD = {
      issueId: 'issue-004',
      issueContent: 'ログ出力遅延',
      occurrenceFrequency: 3,
      impactScore: 68,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1.0,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const issues = [issueA, issueB, issueC, issueD];

    // Act: 各課題の優先度スコアを計算
    const scoredIssues = issues.map((issue) => calculateIssuePriorityScore(issue));

    // Assert: 優先度スコアが計算されていることを確認
    expect(scoredIssues).toHaveLength(4);

    // 各課題のスコアが算出されていることを確認
    const scoreA = scoredIssues[0];
    const scoreB = scoredIssues[1];
    const scoreC = scoredIssues[2];
    const scoreD = scoredIssues[3];

    expect(scoreA).toHaveProperty('issueId', 'issue-001');
    expect(scoreA).toHaveProperty('priorityScore');
    expect(typeof scoreA.priorityScore).toBe('number');

    expect(scoreB).toHaveProperty('issueId', 'issue-002');
    expect(scoreB).toHaveProperty('priorityScore');
    expect(typeof scoreB.priorityScore).toBe('number');

    expect(scoreC).toHaveProperty('issueId', 'issue-003');
    expect(scoreC).toHaveProperty('priorityScore');
    expect(typeof scoreC.priorityScore).toBe('number');

    expect(scoreD).toHaveProperty('issueId', 'issue-004');
    expect(scoreD).toHaveProperty('priorityScore');
    expect(typeof scoreD.priorityScore).toBe('number');

    // 優先度スコアに基づいてソート（降順）
    const sortedIssues = scoredIssues.sort(
      (a, b) => b.priorityScore - a.priorityScore
    );

    // 期待される順序：課題C（impactScore=90）→ 課題A（impactScore=85）→ 課題B（impactScore=72）→ 課題D（impactScore=68）
    expect(sortedIssues[0].issueId).toBe('issue-003'); // 課題C
    expect(sortedIssues[1].issueId).toBe('issue-001'); // 課題A
    expect(sortedIssues[2].issueId).toBe('issue-002'); // 課題B
    expect(sortedIssues[3].issueId).toBe('issue-004'); // 課題D

    // スコアが降順になっていることを確認
    expect(sortedIssues[0].priorityScore).toBeGreaterThanOrEqual(
      sortedIssues[1].priorityScore
    );
    expect(sortedIssues[1].priorityScore).toBeGreaterThanOrEqual(
      sortedIssues[2].priorityScore
    );
    expect(sortedIssues[2].priorityScore).toBeGreaterThanOrEqual(
      sortedIssues[3].priorityScore
    );

    // 全課題のスコアが1～100の範囲内であることを確認
    sortedIssues.forEach((issue) => {
      expect(issue.priorityScore).toBeGreaterThanOrEqual(1);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
    });

    // 各課題に優先度ランクが付与されていることを確認
    expect(sortedIssues[0].priorityRank).toBeDefined();
    expect(sortedIssues[1].priorityRank).toBeDefined();
    expect(sortedIssues[2].priorityRank).toBeDefined();
    expect(sortedIssues[3].priorityRank).toBeDefined();

    // 各課題にカラーコードが付与されていることを確認
    expect(sortedIssues[0].colorCode).toBeDefined();
    expect(sortedIssues[1].colorCode).toBeDefined();
    expect(sortedIssues[2].colorCode).toBeDefined();
    expect(sortedIssues[3].colorCode).toBeDefined();

    // スコア計算の内訳が存在することを確認
    expect(sortedIssues[0].scoreBreakdown).toBeDefined();
    expect(sortedIssues[1].scoreBreakdown).toBeDefined();
    expect(sortedIssues[2].scoreBreakdown).toBeDefined();
    expect(sortedIssues[3].scoreBreakdown).toBeDefined();

    // 計算実行日時が記録されていることを確認
    expect(sortedIssues[0].calculatedAt).toBeDefined();
    expect(sortedIssues[1].calculatedAt).toBeDefined();
    expect(sortedIssues[2].calculatedAt).toBeDefined();
    expect(sortedIssues[3].calculatedAt).toBeDefined();
  });
});