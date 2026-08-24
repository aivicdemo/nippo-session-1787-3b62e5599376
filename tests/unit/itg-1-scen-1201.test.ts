import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Extract and Rank Keywords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1201: [edge] 課題キーワード抽出・ランク付け機能 - 重複する課題キーワードが含まれる場合、発生頻度に正しく集約される
  test('should aggregate duplicate issue keywords by frequency and return ranked list in descending order', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        'データベース接続': 3,
        'エラー': 2,
        'デプロイ': 1
      })
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-dept-head-001'
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toEqual([
      {
        keywordId: expect.any(String),
        keyword: 'データベース接続',
        frequency: 3,
        rank: 1
      },
      {
        keywordId: expect.any(String),
        keyword: 'エラー',
        frequency: 2,
        rank: 2
      },
      {
        keywordId: expect.any(String),
        keyword: 'デプロイ',
        frequency: 1,
        rank: 3
      }
    ]);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001',
        startDate: new Date('2024-01-15T00:00:00Z'),
        endDate: new Date('2024-01-21T23:59:59Z')
      })
    );
  });
});