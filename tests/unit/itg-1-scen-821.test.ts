import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  test('SCEN-821: 複数の課題キーワードが同じ優先度スコアになったとき、抽出順序が保持される', () => {
    // Arrange
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'API障害', frequency: 3 },
          { keyword: 'データベース接続', frequency: 3 },
          { keyword: '認証エラー', frequency: 3 }
        ]
      }),
      assessImpactScore: jest.fn()
        .mockReturnValueOnce({ impactScore: 75 })
        .mockReturnValueOnce({ impactScore: 75 })
        .mockReturnValueOnce({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockReturnValue({ severity: 'high' })
    };

    const input = {
      issueId: 'issue-001',
      issueContent: '昨日はAPI障害が発生した。データベース接続がタイムアウトした。認証エラーも同時に発生した。',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    // Act
    const result = calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    // Assert
    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(75);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toBeDefined();
    
    // 抽出順序の保持を確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(3);
    
    const calls = mockTextAnalysisAdapter.assessImpactScore.mock.calls;
    expect(calls[0][0]).toContain('API障害');
    expect(calls[1][0]).toContain('データベース接続');
    expect(calls[2][0]).toContain('認証エラー');
  });
});