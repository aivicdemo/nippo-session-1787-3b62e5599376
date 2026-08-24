import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能 - 課題キーワードの発生頻度集計', () => {
  // SCEN-483: [normal] 課題自動抽出・優先度判定機能 - 複数の同一キーワードが異なる日報に出現した場合に発生頻度が合算される
  test('複数の日報から同一キーワードが抽出された場合、発生頻度が合算される', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-09T23:59:59Z');
    const requestUserId = 'user-manager-001';
    const minFrequencyThreshold = 1;

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn()
        .mockResolvedValueOnce({
          keywords: [
            {
              keyword: 'データベース接続エラー',
              frequency: 1,
            },
          ],
          confidence: 0.95,
        })
        .mockResolvedValueOnce({
          keywords: [
            {
              keyword: 'データベース接続エラー',
              frequency: 1,
            },
          ],
          confidence: 0.95,
        }),
      assessImpactScore: jest.fn().mockResolvedValue(65),
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
      mockTextAnalysisServiceAdapter,
    );

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    
    const databaseErrorKeyword = result.keywords.find(
      (kw) => kw.keyword === 'データベース接続エラー',
    );
    expect(databaseErrorKeyword).toBeDefined();
    expect(databaseErrorKeyword?.frequency).toBe(2);
    expect(databaseErrorKeyword?.rank).toBe(1);
    
    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toEqual(expect.any(Date));
    expect(result.analysisperiodDays).toBe(2);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(2);
  });
});