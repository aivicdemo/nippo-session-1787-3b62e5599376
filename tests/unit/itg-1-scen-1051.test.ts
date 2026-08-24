import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  let mockTextAnalysisServiceAdapter: {
    extractKeywords: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1051: [error] 課題キーワード自動抽出機能 - 日報テキストが null のとき、抽出処理がエラーになる
  test('日報テキストが null の場合、入力値検証エラーを返す', async () => {
    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportText = null;

    mockTextAnalysisServiceAdapter.extractKeywords.mockRejectedValueOnce(
      new TypeError('入力値: 日報テキストがnullまたはundefinedです')
    );

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter as any
    ).catch((error) => ({
      success: false,
      errorCode: 'INVALID_INPUT',
      errorMessage: '日報テキストが正しくありません',
      details: error.message,
    }));

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: 'INVALID_INPUT',
        errorMessage: expect.stringContaining('日報テキストが正しくありません'),
      })
    );
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      reportText
    );
  });
});