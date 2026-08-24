import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-557: [normal] 課題優先度判定機能 - 複数の課題が報告されている場合、各課題に対して影響度スコア（0～100）が計算される
  test('複数の課題が報告されている場合、各課題に対して影響度スコア（0～100）が計算され、スコア高い順に並べられる', () => {
    // テストデータ準備：3件の課題を含む入力データ
    const issueInputs = [
      {
        issueId: 'issue-001',
        issueContent: 'サーバーダウン',
        occurrenceFrequency: 5,
        impactScore: 85,
        affectedTeamCount: 8,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15',
        teamId: 'team-alpha'
      },
      {
        issueId: 'issue-002',
        issueContent: 'API遅延',
        occurrenceFrequency: 3,
        impactScore: 62,
        affectedTeamCount: 4,
        resolutionDaysAverage: 1,
        reportingDate: '2024-01-15',
        teamId: 'team-alpha'
      },
      {
        issueId: 'issue-003',
        issueContent: 'データベース接続エラー',
        occurrenceFrequency: 4,
        impactScore: 71,
        affectedTeamCount: 6,
        resolutionDaysAverage: 1.5,
        reportingDate: '2024-01-15',
        teamId: 'team-alpha'
      }
    ];

    // 各課題について優先度スコアを計算
    const priorityResults = issueInputs.map(issue => 
      calculateIssuePriorityScore(issue)
    );

    // 優先度スコアの高い順にソート
    const sortedResults = priorityResults.sort((a, b) => b.priorityScore - a.priorityScore);

    // 期待値：各課題のスコアが0～100の整数値であることを確認
    priorityResults.forEach(result => {
      expect(result.priorityScore).toBeGreaterThanOrEqual(1);
      expect(result.priorityScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.priorityScore)).toBe(true);
    });

    // 期待値：スコアの高い順に並べられていることを確認
    expect(sortedResults[0].issueId).toBe('issue-001'); // impactScore 85 (最高)
    expect(sortedResults[1].issueId).toBe('issue-003'); // impactScore 71 (中)
    expect(sortedResults[2].issueId).toBe('issue-002'); // impactScore 62 (最低)

    // 期待値：スコア値がモック入力値と一致していることを確認
    const result001 = priorityResults.find(r => r.issueId === 'issue-001');
    const result002 = priorityResults.find(r => r.issueId === 'issue-002');
    const result003 = priorityResults.find(r => r.issueId === 'issue-003');

    expect(result001).toBeDefined();
    expect(result002).toBeDefined();
    expect(result003).toBeDefined();

    // 各結果に優先度ランクが付与されていることを確認
    expect(result001?.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result002?.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result003?.priorityRank).toMatch(/^(高|中|低)$/);

    // 各結果にスコア内訳が含まれていることを確認
    expect(result001?.scoreBreakdown).toBeDefined();
    expect(result001?.scoreBreakdown?.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result001?.scoreBreakdown?.frequencyScore).toBeLessThanOrEqual(40);
    expect(result001?.scoreBreakdown?.impactScore).toBeGreaterThanOrEqual(0);
    expect(result001?.scoreBreakdown?.impactScore).toBeLessThanOrEqual(40);
    expect(result001?.scoreBreakdown?.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result001?.scoreBreakdown?.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // 各結果にダッシュボード用の色コードが含まれていることを確認
    expect(result001?.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(result002?.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(result003?.colorCode).toMatch(/^#[0-9A-F]{6}$/i);

    // 各結果に計算実行日時が ISO 8601 形式で含まれていることを確認
    expect(result001?.calculatedAt).toBeDefined();
    expect(new Date(result001?.calculatedAt || '').toISOString()).toBeDefined();
  });
});