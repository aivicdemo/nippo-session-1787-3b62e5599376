import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-833
  test('課題項目テキストが空文字列で渡されたときエラーになる', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('課題項目テキストが空です')
      ),
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

    const emptyChallengText = '';

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter, emptyChallengText)
    ).rejects.toThrow(/課題項目テキストが空です/);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      emptyChallengText
    );
  });
});