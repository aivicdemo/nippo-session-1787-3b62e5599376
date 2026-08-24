import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-767
  test('正規化対象の課題テキストが空文字列のとき、エラーを返す', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        totalCount: 0,
      }),
    };

    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    }).toThrow(/課題テキスト|空/);
  });
});