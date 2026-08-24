import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  test('SCEN-649: チーム波及度スコア計算時に小数点以下の端数が正確に丸められる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue(42.6666666667),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-649-001',
      issueContent: 'データベース接続エラー',
      occurrenceFrequency: 5,
      impactScore: 42.6666666667,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);

    expect(result).toHaveProperty('issueId', 'issue-649-001');
    expect(result).toHaveProperty('priorityScore');
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    expect(result).toHaveProperty('scoreBreakdown');
    expect(result.scoreBreakdown).toHaveProperty('impactScore');
    
    expect(result.scoreBreakdown.impactScore).toBe(42.67);
  });
});