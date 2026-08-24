import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1089: [edge] 課題キーワード抽出機能 - 発生頻度が完全に同じ複数キーワードが並ぶ場合、その順序が一貫している
  test('should maintain consistent keyword order when multiple keywords have identical frequencies across multiple invocations', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-manager-001';

    const reportText =
      'システム障害対応が必要です。データベース接続エラーが発生しました。システム障害は深刻です。データベース接続エラーは解決が急務です。';

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'システム障害', frequency: 5 },
        { keyword: 'データベース接続エラー', frequency: 5 },
        { keyword: 'エラー対応', frequency: 3 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const results: RankedIssueKeywordList[] = [];

    for (let iteration = 0; iteration < 4; iteration++) {
      const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
      results.push(result);
    }

    const firstRunKeywordOrder = results[0].keywords.map((k) => k.keyword);
    const secondRunKeywordOrder = results[1].keywords.map((k) => k.keyword);
    const thirdRunKeywordOrder = results[2].keywords.map((k) => k.keyword);
    const fourthRunKeywordOrder = results[3].keywords.map((k) => k.keyword);

    expect(firstRunKeywordOrder).toEqual(secondRunKeywordOrder);
    expect(firstRunKeywordOrder).toEqual(thirdRunKeywordOrder);
    expect(firstRunKeywordOrder).toEqual(fourthRunKeywordOrder);

    expect(results[0].keywords[0].keyword).toBe('システム障害');
    expect(results[0].keywords[0].frequency).toBe(5);
    expect(results[0].keywords[0].rank).toBe(1);

    expect(results[0].keywords[1].keyword).toBe('データベース接続エラー');
    expect(results[0].keywords[1].frequency).toBe(5);
    expect(results[0].keywords[1].rank).toBe(2);

    expect(results[0].keywords[2].keyword).toBe('エラー対応');
    expect(results[0].keywords[2].frequency).toBe(3);
    expect(results[0].keywords[2].rank).toBe(3);

    expect(results[0].totalKeywordCount).toBe(3);
    expect(results[0].analysisperiodDays).toBe(7);
  });
});