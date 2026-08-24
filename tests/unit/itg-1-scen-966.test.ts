import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア計算と色分け表示', () => {
  // SCEN-966: [edge] 課題優先度スコア計算・色分け表示機能 - 優先度スコアが黄色閾値未満（49点）のとき黄色ではなく表示される
  test('優先度スコア49点のとき黄色ではなく緑色で表示される', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(49),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'テスト実行の遅延が発生している',
      occurrenceFrequency: 2,
      impactScore: 49,
      affectedTeamCount: 1,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisService);

    expect(result.priorityScore).toBe(31);
    expect(result.priorityRank).toBe('低');
    expect(result.colorCode).toBe('#00FF00');
    expect(result.scoreBreakdown.frequencyScore).toBe(8);
    expect(result.scoreBreakdown.impactScore).toBe(19);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(4);
    expect(result.issueId).toBe('ISSUE-001');
  });
});