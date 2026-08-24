import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能 - 影響度スコア検証', () => {
  // SCEN-1326
  test('影響度スコアが0未満のとき処理を中止し例外を発生させる', async () => {
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システムダウン'],
        frequency: { 'システムダウン': 5 },
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/影響度スコア/);
  });
});