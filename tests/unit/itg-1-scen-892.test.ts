import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出と発生頻度ランク付け機能', () => {
  // SCEN-892: [normal] 課題キーワード抽出と発生頻度ランク付け機能 - 複数の日報から同一の課題キーワードが抽出されるとき、発生頻度が正しくカウントされる
  test('複数の日報から同一の課題キーワードが抽出されるとき、発生頻度が正しくカウントされてランク付けされる', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2026-08-20T00:00:00Z');
    const endDate = new Date('2026-08-20T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-manager-001';

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: '接続エラー',
          frequency: 1,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThan(0);

    const rankedKeyword = result.keywords[0];
    expect(rankedKeyword.keyword).toBe('接続エラー');
    expect(rankedKeyword.frequency).toBe(3);
    expect(rankedKeyword.rank).toBe(1);

    expect(result.totalKeywordCount).toBeGreaterThan(0);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(1);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});