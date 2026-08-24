import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-770: [error] 課題自動抽出・優先度判定機能 - 発生頻度が整数でない（小数）とき、エラーを返す
  test('発生頻度が小数値の場合、エラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 3.5,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportText = 'データベース接続エラーが発生している。昨日も同じエラーが出た';

    expect(
      async () =>
        await extractAndRankIssueKeywords(
          input,
          reportText,
          mockTextAnalysisServiceAdapter
        )
    ).rejects.toThrow(/発生頻度は整数である必要があります/);
  });
});