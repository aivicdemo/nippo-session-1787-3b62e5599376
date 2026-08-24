import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定機能 - チーム波及度スコアが0未満の場合の処理', () => {
  // SCEN-1091
  test('チーム波及度スコアが負の値の場合、システムがデフォルト重要度で処理する', () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを準備
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生しており、チーム全体の業務に支障が出ている状況です',
      occurrenceFrequency: 1,
      impactScore: -5,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-001',
    };

    // Act: 負のチーム波及度スコアを含む入力で課題優先度スコアを計算
    const result = calculateIssuePriorityScore(input);

    // Assert: 返却されたスコアを検証
    // 負の値は0-100の有効範囲外であるため、計算ロジックは負の値をそのまま受け取ることを確認
    // また、UIに表示されるべきメッセージをシミュレート
    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    // 負のimpactScoreが渡された場合、デフォルト重要度（中）で処理されることを確認
    expect(result.priorityRank).toBe('中');
    // スコア内訳で負の値が適切に処理されていることを確認
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    // 色コードがデフォルト（黄色）に設定されることを確認
    expect(result.colorCode).toBe('#FFFF00');
    // 計算実行日時が記録されていることを確認
    expect(result.calculatedAt).toBeDefined();
  });
});