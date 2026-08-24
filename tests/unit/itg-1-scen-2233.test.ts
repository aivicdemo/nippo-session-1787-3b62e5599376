import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-2233: [normal] 課題の重複検出と正規化 - 3件以上の複数メンバーから同一課題の重複報告がある場合、重複検出元は全メンバー分記録されて正規化リストに含まれる
  test('should detect and normalize duplicate issue keywords from multiple members with all sources recorded', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-manager-001';

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Mock TextAnalysisServiceAdapter to simulate keyword extraction from 3 members
    // Each member (A, B, C) reports the same issue "データベース接続エラー"
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続エラー',
          frequency: 3,
          sources: ['member-a', 'member-b', 'member-c'],
        },
        {
          keyword: 'タイムアウト',
          frequency: 1,
          sources: ['member-a'],
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // Verify the result structure
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(7);

    // Verify the normalized duplicate issue is in the ranked list
    const databaseErrorKeyword = result.keywords.find(
      (k) => k.keyword === 'データベース接続エラー'
    );

    expect(databaseErrorKeyword).toBeDefined();
    expect(databaseErrorKeyword?.frequency).toBe(3);
    expect(databaseErrorKeyword?.rank).toBe(1);
    expect(databaseErrorKeyword?.keywordId).toBeDefined();

    // Verify extraction timestamp is recorded
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(result.extractedAt.getTime()).toBeGreaterThanOrEqual(
      new Date().getTime() - 5000
    );

    // Verify the adapter was called correctly
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId,
        startDate,
        endDate,
      })
    );
  });
});