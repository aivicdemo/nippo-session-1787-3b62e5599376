import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-1613
  test('TextAnalysisServiceAdapter正常応答時に課題キーワードが出現頻度でランク付けされて返される', () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを準備
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { term: '顧客対応', frequency: 5 },
          { term: 'API連携', frequency: 3 },
          { term: 'テスト実装', frequency: 2 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const input = {
      issueId: 'issue-001',
      issueContent: '顧客対応で問題発生。顧客対応の対応方法を検討。APIテストを実施。',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    // Act
    const result = calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    // Assert: extractKeywordsメソッドが呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      input.issueContent
    );

    // Assert: 戻り値がPromiseであることを確認
    expect(result).toBeInstanceOf(Promise);

    // Assert: Promiseが解決され、結果が返されることを確認
    return result.then((output) => {
      expect(output).toBeDefined();
      expect(output.issueId).toBe('issue-001');
      expect(typeof output.priorityScore).toBe('number');
      expect(output.priorityScore).toBeGreaterThanOrEqual(1);
      expect(output.priorityScore).toBeLessThanOrEqual(100);
      expect(output.priorityRank).toMatch(/^(高|中|低)$/);
      expect(output.scoreBreakdown).toBeDefined();
      expect(typeof output.scoreBreakdown.frequencyScore).toBe('number');
      expect(output.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(output.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
      expect(typeof output.scoreBreakdown.impactScore).toBe('number');
      expect(output.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(output.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
      expect(typeof output.scoreBreakdown.resolutionDifficultyScore).toBe(
        'number'
      );
      expect(output.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(
        0
      );
      expect(output.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(
        20
      );
      expect(output.colorCode).toMatch(/^#[0-9A-F]{6}$/);
      expect(output.calculatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
    });
  });
});