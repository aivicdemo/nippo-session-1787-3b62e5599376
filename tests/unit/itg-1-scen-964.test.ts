import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア色分け表示', () => {
  // SCEN-964: [edge] 課題優先度スコア計算・色分け表示機能 - 優先度スコアが赤色閾値超過（81点）のとき赤色で表示される
  test('優先度スコア81点のとき赤色コード#FF0000が返される', () => {
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout in production',
      occurrenceFrequency: 8,
      impactScore: 81,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(81),
      classifyIssueSeverity: jest.fn(),
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);

    expect(result).toBeDefined();
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(81);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.calculatedAt).toBeDefined();
  });
});