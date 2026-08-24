import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランキング機能', () => {
  // SCEN-1087: 重複したキーワード項目の発生頻度が正確に集約される
  test('重複したキーワードを含む日報テキストから正確に集約された発生頻度を返す', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-pm-001';

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース', frequency: 3 },
        { keyword: '接続エラー', frequency: 1 },
        { keyword: '応答が遅い', frequency: 1 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toHaveLength(3);

    expect(result.keywords[0]).toEqual({
      keyword: 'データベース',
      frequency: 3,
      rank: 1,
      keywordId: expect.any(String),
    });

    expect(result.keywords[1]).toEqual({
      keyword: '接続エラー',
      frequency: 1,
      rank: 2,
      keywordId: expect.any(String),
    });

    expect(result.keywords[2]).toEqual({
      keyword: '応答が遅い',
      frequency: 1,
      rank: 3,
      keywordId: expect.any(String),
    });

    expect(result.totalKeywordCount).toBe(5);
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBe(7);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId,
        startDate,
        endDate,
      })
    );
  });
});