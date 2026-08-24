import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1733: [error] 影響度スコアが範囲外（100 を超える）のとき優先度スコア算出がエラーになる
  test('影響度スコア 105（範囲外）が入力された場合、RangeError がスローされエラーメッセージに「影響度スコアは0〜100の範囲で指定してください」を含む', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'システム障害', frequency: 3 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(105),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001'
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).rejects.toThrow(/影響度スコアは0～100の範囲で指定してください/);
  });
});