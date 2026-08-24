import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算・色分け表示機能', () => {
  test('SCEN-938: TextAnalysisServiceAdapterが正常応答したとき、抽出されたキーワードの影響度スコアを計算に含める', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'サーバーダウン',
            frequency: 3,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'サーバーダウン',
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const issuePriorityScoringInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウン対応中',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 4,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      issuePriorityScoringInput,
      mockTextAnalysisAdapter
    );

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(75);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThan(0);
    expect(result.calculatedAt).toBeDefined();

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'サーバーダウン',
      })
    );
  });
});