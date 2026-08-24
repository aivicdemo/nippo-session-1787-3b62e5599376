import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  test('SCEN-505: 課題キーワード出現頻度がちょうど閾値100%で最高優先度に分類される', () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを準備
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'サーバー障害',
            frequency: 3,
            occurrenceRate: 100,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'サーバー障害',
        impactScore: 95,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'サーバー障害 サーバー障害 サーバー障害',
      occurrenceFrequency: 3,
      impactScore: 95,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    // Act: calculateIssuePriorityScoreを実行
    const result = calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    // Assert: 優先度スコアが最高優先度（100点相当）に分類されることを検証
    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(100);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(30);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(35);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(15);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});