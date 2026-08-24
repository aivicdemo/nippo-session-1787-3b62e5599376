import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-1136: [error] 抽出課題データ有効性検証機能 - 課題キーワードが欠落しているデータがあるとき検証エラーになる
  test('課題キーワードが欠落している場合、VALIDATION_ERROR_KEYWORDS_MISSINGエラーが返される', async () => {
    // Arrange: モック化されたTextAnalysisServiceAdapterを設定
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [], // キーワード欠落のレスポンス
        frequency: {},
        extractedAt: new Date('2024-01-15T09:00:00Z'),
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // 入力データの準備：『昨日やったこと』『今日やること』『抱えている課題』の3フィールド
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act & Assert: 課題キーワード抽出を実行し、検証エラーが発生することを確認
    try {
      const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);
      
      // 検証エラーが返されていることを確認
      expect(result).toBeDefined();
      expect(result.errorCode).toBe('VALIDATION_ERROR_KEYWORDS_MISSING');
      expect(result.errorMessage).toBe('課題キーワードが指定されていません。課題内容を確認してください');
      expect(result.isValid).toBe(false);
      expect(result.shouldBlockSubmission).toBe(true);
    } catch (error: unknown) {
      if (error instanceof Error && 'errorCode' in error) {
        const typedError = error as { errorCode: string; errorMessage: string };
        expect(typedError.errorCode).toBe('VALIDATION_ERROR_KEYWORDS_MISSING');
        expect(typedError.errorMessage).toBe('課題キーワードが指定されていません。課題内容を確認してください');
      } else {
        throw error;
      }
    }

    // TextAnalysisServiceAdapterのextractKeywordsメソッドが呼ばれたことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});