import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア算出機能 - 影響度スコア小数値の丸め処理', () => {
  test('SCEN-777: 影響度スコア（0-100）の計算結果が小数を含むとき、丸め処理により整数に変換される', () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        totalKeywordCount: 0,
        extractedAt: new Date('2024-01-15T09:00:00Z'),
        analysisPeriodDays: 30,
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce(67.5)
        .mockResolvedValueOnce(82.3)
        .mockResolvedValueOnce(91.8),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input1: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラー',
      occurrenceFrequency: 5,
      impactScore: 67.5,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const input2: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: 'ビルドパイプラインの失敗',
      occurrenceFrequency: 8,
      impactScore: 82.3,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const input3: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: 'パフォーマンス低下',
      occurrenceFrequency: 12,
      impactScore: 91.8,
      affectedTeamCount: 4,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // Act & Assert: 各入力で優先度スコア算出を実行し、丸め処理を検証
    const result1 = calculateIssuePriorityScore(input1, mockTextAnalysisAdapter);
    expect(result1.priorityScore).toBe(68);
    expect(typeof result1.priorityScore).toBe('number');
    expect(Number.isInteger(result1.priorityScore)).toBe(true);
    expect(result1.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result1.priorityScore).toBeLessThanOrEqual(100);

    const result2 = calculateIssuePriorityScore(input2, mockTextAnalysisAdapter);
    expect(result2.priorityScore).toBe(82);
    expect(typeof result2.priorityScore).toBe('number');
    expect(Number.isInteger(result2.priorityScore)).toBe(true);
    expect(result2.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result2.priorityScore).toBeLessThanOrEqual(100);

    const result3 = calculateIssuePriorityScore(input3, mockTextAnalysisAdapter);
    expect(result3.priorityScore).toBe(92);
    expect(typeof result3.priorityScore).toBe('number');
    expect(Number.isInteger(result3.priorityScore)).toBe(true);
    expect(result3.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result3.priorityScore).toBeLessThanOrEqual(100);

    // scoreBreakdownが含まれていることを確認
    expect(result1.scoreBreakdown).toBeDefined();
    expect(result1.scoreBreakdown.frequencyScore).toBeDefined();
    expect(result1.scoreBreakdown.impactScore).toBeDefined();
    expect(result1.scoreBreakdown.resolutionDifficultyScore).toBeDefined();
    expect(typeof result1.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof result1.scoreBreakdown.impactScore).toBe('number');
    expect(typeof result1.scoreBreakdown.resolutionDifficultyScore).toBe('number');
  });
});