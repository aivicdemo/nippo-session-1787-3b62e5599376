import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1895
  test('検索日付範囲の開始日と終了日が同日の場合、該当日の課題が抽出される', () => {
    const targetDate = new Date('2026-08-20T00:00:00Z');
    const extractedKeywordsOnTargetDate = [
      { keyword: 'データベース接続エラー', frequency: 3 },
      { keyword: 'API応答遅延', frequency: 2 },
      { keyword: 'メモリリーク', frequency: 1 },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue(extractedKeywordsOnTargetDate),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: targetDate,
      endDate: targetDate,
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result = extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'データベース接続エラー',
      frequency: 3,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'API応答遅延',
      frequency: 2,
      rank: 2,
    });
    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: 'メモリリーク',
      frequency: 1,
      rank: 3,
    });
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toEqual(expect.any(Date));
    expect(result.analysisperiodDays).toBe(1);
  });
});