import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  test('SCEN-965: 優先度スコアがちょうど黄色閾値（50点）のとき黄色で表示される', () => {
    // Arrange: TextAnalysisServiceAdapterをモック化し、assessImpactScoreが50を返すよう設定
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['重要な課題'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(50),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // 入力データ: 課題入力フォームに『重要な課題』というテキストを入力
    const inputData = {
      issueId: 'issue-001',
      issueContent: '重要な課題',
      occurrenceFrequency: 2,
      impactScore: 50,
      affectedTeamCount: 3,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha',
    };

    // Act: 優先度スコア計算ロジックを実行
    const result = calculateIssuePriorityScore(inputData);

    // Assert: 期待結果を検証
    // スコア値がちょうど50.0であることを確認
    expect(result.priorityScore).toBe(50);

    // 色分けルール（50≧スコア>30→黄色）に準拠した色コードを確認
    expect(result.colorCode).toBe('#FFFF00');

    // 優先度ランクが『中』であることを確認
    expect(result.priorityRank).toBe('中');

    // スコア計算の内訳を確認
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBe(50);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // スコア計算実行日時がISO 8601形式で記録されていることを確認
    expect(result.calculatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // 課題IDが正しく返却されることを確認
    expect(result.issueId).toBe('issue-001');
  });
});