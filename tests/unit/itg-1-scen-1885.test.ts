import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題検索・ランク付け機能 - キーワード空文字列エラーハンドリング', () => {
  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  // SCEN-1885
  test('キーワード入力が空文字列のとき、キーワード入力エラーを返す', () => {
    const emptyKeywordInput = {
      teamId: 'team-123',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-456',
      keyword: '',
    };

    expect(() =>
      extractAndRankIssueKeywords(emptyKeywordInput, mockTextAnalysisServiceAdapter)
    ).toThrow(/キーワード/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});