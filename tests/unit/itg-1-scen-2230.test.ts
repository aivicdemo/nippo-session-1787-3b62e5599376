import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題の重複検出と正規化 - 日報が1件のみ提出された場合', () => {
  test('SCEN-2230: 課題キーワードが正規化リストに1件として含まれる', async () => {
    const stubTextAnalysisServiceAdapter = {
      extractKeywords: async () => ({
        keywords: ['データベース接続エラー'],
        frequencies: [1],
      }),
      assessImpactScore: async () => 50,
      classifyIssueSeverity: async () => 'medium',
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-08T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      stubTextAnalysisServiceAdapter
    );

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
    expect(result.keywords[0].frequency).toBe(1);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.totalKeywordCount).toBe(1);
    expect(result.analysisperiodDays).toBe(1);
    expect(result.extractedAt).toEqual(expect.any(Date));
  });
});