import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('優先度スコア計算機能', () => {
  // SCEN-1306
  test('[normal] キーワード頻度と影響度スコアから優先度スコアが計算される', () => {
    // TextAnalysisServiceAdapterのスタブを用意
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'API', frequency: 5 },
        { keyword: '統合', frequency: 3 },
        { keyword: '障害', frequency: 2 },
      ]),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce(85)  // API の影響度スコア
        .mockResolvedValueOnce(60)  // 統合 の影響度スコア
        .mockResolvedValueOnce(95), // 障害 の影響度スコア
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'API と 統合 と 障害 に関する課題',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // 計算関数を実行
    const result = calculateIssuePriorityScore(input);

    // 検証: 優先度スコアが正確に計算されていること
    // 計算式: ((5×85) + (3×60) + (2×95)) ÷ (5+3+2) = (425 + 180 + 190) ÷ 10 = 795 ÷ 10 = 79.5
    expect(result.priorityScore).toBe(79.5);
    expect(result.issueId).toBe('issue-001');
    expect(typeof result.priorityRank).toBe('string');
    expect(typeof result.colorCode).toBe('string');
    expect(result.scoreBreakdown).toBeDefined();
    expect(typeof result.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof result.scoreBreakdown.impactScore).toBe('number');
    expect(typeof result.scoreBreakdown.resolutionDifficultyScore).toBe('number');
    expect(result.calculatedAt).toBeDefined();
  });
});