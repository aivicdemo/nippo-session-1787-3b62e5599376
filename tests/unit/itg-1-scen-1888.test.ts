import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題検索・ランク付け機能', () => {
  // SCEN-1888
  test('指定キーワードが日付範囲内のいかなる報告データにもマッチしないとき、空配列が返される', async () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-10T00:00:00Z'),
      endDate: new Date('2024-01-11T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        totalCount: 0,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(result.keywords).toEqual([]);
    expect(result.totalKeywordCount).toBe(0);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(2);
  });
});