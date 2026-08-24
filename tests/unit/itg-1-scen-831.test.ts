import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-831
  test('日報データが空の状態でキーワード抽出を実行したときエラーになる', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('日報データが入力されていません。キーワード抽出を実行するには日報テキストが必要です')
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-admin-001',
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).rejects.toThrow(/日報データが入力されていません/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});