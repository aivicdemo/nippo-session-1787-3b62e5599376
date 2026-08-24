import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先順位付け機能', () => {
  // SCEN-1630
  test('TextAnalysisServiceAdapter.extractKeywords の呼び出しが失敗したとき、リトライを3回実行し全て失敗後は処理を中止しエラーを返す', async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn()
        .mockRejectedValueOnce(new Error('API timeout on attempt 1'))
        .mockRejectedValueOnce(new Error('API timeout on attempt 2'))
        .mockRejectedValueOnce(new Error('API timeout on attempt 3')),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    // 日報テキスト入力を準備（課題キーワード抽出が必要な入力）
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const mockReportTexts = [
      {
        reportId: 'report-001',
        content: '昨日やったこと: バグ修正対応\n今日やること: テスト実装\n抱えている課題: API 連携遅延、データベース性能問題'
      },
      {
        reportId: 'report-002',
        content: '昨日やったこと: レビュー実施\n今日やること: デプロイ準備\n抱えている課題: デプロイ遅延、セキュリティ脆弱性'
      }
    ];

    // Act & Assert: 関数を呼び出してリトライ動作を検証
    let errorResult: any;
    try {
      await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    } catch (error) {
      errorResult = error;
    }

    // リトライ回数を確認（合計3回）
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    // エラーレスポンスを検証
    expect(errorResult).toBeDefined();
    expect(errorResult.code).toBe('KEYWORD_EXTRACTION_FAILED');
    expect(errorResult.message).toMatch(/課題分析.*利用できません/);
    expect(errorResult.retryCount).toBe(3);

    // キーワード抽出結果は返されていないことを確認
    expect(errorResult.keywords).toBeUndefined();
  });
});