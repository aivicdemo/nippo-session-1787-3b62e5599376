import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  // SCEN-535: TextAnalysisServiceAdapterのassessImpactScoreが失敗した場合、ダッシュボード表示メッセージと前回キャッシュ表示を検証
  test('TextAnalysisServiceAdapterの影響度スコア判定失敗時、3回再試行後にダッシュボード不可メッセージを返し、キャッシュから前回結果を表示', async () => {
    // 前回のキャッシュ結果（初期状態で存在）
    const previousCachedResult: RankedIssueKeywordList = {
      keywords: [
        {
          keywordId: 'kw-001',
          keyword: 'データベース接続エラー',
          frequency: 5,
          rank: 1,
        },
        {
          keywordId: 'kw-002',
          keyword: 'メモリリーク',
          frequency: 3,
          rank: 2,
        },
      ],
      totalKeywordCount: 2,
      extractedAt: new Date('2024-01-14T10:00:00Z'),
      analysisperiodDays: 7,
    };

    // TextAnalysisServiceAdapterをスタブ化：assessImpactScoreが3回の再試行全て失敗
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { text: 'データベース接続エラー', frequency: 5 },
          { text: 'メモリリーク', frequency: 3 },
        ],
      }),
      assessImpactScore: jest
        .fn()
        .mockRejectedValueOnce(new Error('API Timeout'))
        .mockRejectedValueOnce(new Error('API Timeout'))
        .mockRejectedValueOnce(new Error('API Timeout')),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // 関数呼び出し（外部サービス失敗時の再試行と回復処理を検証）
    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter, previousCachedResult);

    // 期待結果：
    // 1. assessImpactScoreが3回呼ばれたこと（3秒・10秒・30秒インターバルで再試行）を確認
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(3);

    // 2. 結果にダッシュボード不可メッセージが含まれていることを確認
    expect(result).toHaveProperty('dashboardUnavailableMessage');
    expect(result.dashboardUnavailableMessage).toBe(
      '課題分析が一時的に利用できません。手動入力をご利用ください',
    );

    // 3. 前回のキャッシュ結果が返されていることを確認
    expect(result.keywords).toEqual(previousCachedResult.keywords);
    expect(result.totalKeywordCount).toBe(previousCachedResult.totalKeywordCount);
    expect(result.extractedAt).toEqual(previousCachedResult.extractedAt);

    // 4. キーワード自動抽出機能が無効化されたことを確認（isAutoExtractionEnabled フラグ）
    expect(result).toHaveProperty('isAutoExtractionEnabled');
    expect(result.isAutoExtractionEnabled).toBe(false);

    // 5. ユーザーが手動入力できる状態になっていることを確認（manualInputRequired フラグ）
    expect(result).toHaveProperty('manualInputRequired');
    expect(result.manualInputRequired).toBe(true);
  });
});