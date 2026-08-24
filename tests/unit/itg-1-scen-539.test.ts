import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('Issue Extraction and Prioritization - Impact Score Validation', () => {
  // SCEN-539: [error] 課題キーワード自動抽出・優先度判定機能 - 影響度スコアが負の値で返された場合、エラーを返す
  test('should return error when impact score is negative', () => {
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'システム障害',
            frequency: 3,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      extractedKeywords: [
        {
          keyword: 'システム障害',
          frequency: 3,
        },
      ],
      teamId: 'team-001',
      analysisStartDate: new Date('2024-01-08T00:00:00Z'),
      analysisEndDate: new Date('2024-01-14T23:59:59Z'),
      requestUserId: 'user-001',
    };

    const result = extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_IMPACT_SCORE',
          message: expect.stringMatching(/影響度スコアが0未満/),
          score: -5,
        }),
      })
    );
  });
});