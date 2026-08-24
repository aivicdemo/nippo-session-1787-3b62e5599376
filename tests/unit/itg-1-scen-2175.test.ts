import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  // SCEN-2175
  test('課題キーワード辞書が存在しないとき、エラーが発生する', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('KeywordDictionaryNotFound: 課題キーワード辞書テーブルが初期化されていません')
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).rejects.toThrow(/KeywordDictionaryNotFound/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});