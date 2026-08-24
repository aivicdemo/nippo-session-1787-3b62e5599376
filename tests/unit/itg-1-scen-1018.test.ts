import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付与', () => {
  test('SCEN-1018: 課題テキストが高・中・低のいずれかに正確に分類される', () => {
    // Arrange
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    // 高重要度ケース
    mockTextAnalysisService.classifyIssueSeverity.mockReturnValueOnce('高');
    const highSeverityInput = {
      issueId: 'issue-001',
      issueContent: '本番環境でデータベース接続がタイムアウトしている',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    // Act & Assert - 高重要度
    const highResult = calculateIssuePriorityScore(highSeverityInput, mockTextAnalysisService);
    expect(highResult.priorityRank).toBe('高');
    expect(highResult.priorityScore).toBeGreaterThanOrEqual(70);

    // 中重要度ケース
    mockTextAnalysisService.classifyIssueSeverity.mockReturnValueOnce('中');
    const mediumSeverityInput = {
      issueId: 'issue-002',
      issueContent: 'レポート作成の手順書が最新でない',
      occurrenceFrequency: 2,
      impactScore: 45,
      affectedTeamCount: 1,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const mediumResult = calculateIssuePriorityScore(mediumSeverityInput, mockTextAnalysisService);
    expect(mediumResult.priorityRank).toBe('中');
    expect(mediumResult.priorityScore).toBeGreaterThanOrEqual(40);
    expect(mediumResult.priorityScore).toBeLessThan(70);

    // 低重要度ケース
    mockTextAnalysisService.classifyIssueSeverity.mockReturnValueOnce('低');
    const lowSeverityInput = {
      issueId: 'issue-003',
      issueContent: 'オフィスのプリンター用紙が少なくなった',
      occurrenceFrequency: 1,
      impactScore: 15,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const lowResult = calculateIssuePriorityScore(lowSeverityInput, mockTextAnalysisService);
    expect(lowResult.priorityRank).toBe('低');
    expect(lowResult.priorityScore).toBeLessThan(40);

    // 各結果がすべて有効な値を持つことを確認
    expect(highResult).toHaveProperty('issueId', 'issue-001');
    expect(highResult).toHaveProperty('priorityScore');
    expect(highResult).toHaveProperty('priorityRank');
    expect(highResult).toHaveProperty('scoreBreakdown');
    expect(highResult).toHaveProperty('colorCode');
    expect(highResult).toHaveProperty('calculatedAt');

    expect(mediumResult).toHaveProperty('issueId', 'issue-002');
    expect(mediumResult).toHaveProperty('priorityScore');
    expect(mediumResult).toHaveProperty('priorityRank');

    expect(lowResult).toHaveProperty('issueId', 'issue-003');
    expect(lowResult).toHaveProperty('priorityScore');
    expect(lowResult).toHaveProperty('priorityRank');

    // 分類値が1つだけであることを確認（複数分類なし）
    expect(['高', '中', '低']).toContain(highResult.priorityRank);
    expect(['高', '中', '低']).toContain(mediumResult.priorityRank);
    expect(['高', '中', '低']).toContain(lowResult.priorityRank);

    // scoreBreakdownが正しく計算されていることを確認
    expect(highResult.scoreBreakdown).toHaveProperty('frequencyScore');
    expect(highResult.scoreBreakdown).toHaveProperty('impactScore');
    expect(highResult.scoreBreakdown).toHaveProperty('resolutionDifficultyScore');

    expect(highResult.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(highResult.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(highResult.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(highResult.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(highResult.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(highResult.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // 優先度スコアが1～100の範囲内であることを確認
    expect(highResult.priorityScore).toBeGreaterThanOrEqual(1);
    expect(highResult.priorityScore).toBeLessThanOrEqual(100);
    expect(mediumResult.priorityScore).toBeGreaterThanOrEqual(1);
    expect(mediumResult.priorityScore).toBeLessThanOrEqual(100);
    expect(lowResult.priorityScore).toBeGreaterThanOrEqual(1);
    expect(lowResult.priorityScore).toBeLessThanOrEqual(100);

    // 色コードが正しく設定されていることを確認
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(highResult.colorCode);
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(mediumResult.colorCode);
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(lowResult.colorCode);

    // calculatedAtがISO 8601形式であることを確認
    expect(highResult.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(mediumResult.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(lowResult.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});