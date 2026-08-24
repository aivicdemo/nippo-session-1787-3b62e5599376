import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization', () => {
  // SCEN-1321: [error] 課題キーワード自動抽出・優先度判定機能 - 報告者のチーム ID が null のとき影響度スコア計算を中止し例外を発生させる
  test('should throw error when teamId is null during impact score calculation', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['バグ対応', 'デプロイ遅延'],
        confidence: 0.85,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: null as unknown as string,
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const extractedKeywords = [
      { keywordId: 'kw-001', keyword: 'バグ対応', frequency: 3 },
      { keywordId: 'kw-002', keyword: 'デプロイ遅延', frequency: 2 },
    ];

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter, extractedKeywords)
    ).rejects.toThrow(/teamId/i);

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});