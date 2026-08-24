import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - extractAndRankIssueKeywords', () => {
  // SCEN-1480: [normal] 課題キーワード自動抽出・頻度ランク付け機能 - 前週7日間の日報複数件から課題キーワードが抽出され発生頻度でランク付けされる
  test('should extract and rank issue keywords by frequency from multiple reports over 7 days', async () => {
    // テストデータ準備：過去7日間分の日報を5件作成
    const testTeamId = 'team-001';
    const testUserId = 'user-001';
    const endDate = new Date('2024-01-21T23:59:59Z');
    const startDate = new Date('2024-01-15T00:00:00Z');

    // 抽出対象となる過去7日間の日報テキスト
    // 日報1『サーバー接続エラー、ネットワーク遅延』
    // 日報2『サーバー接続エラー』
    // 日報3『ネットワーク遅延、メモリ不足』
    // 日報4『メモリ不足』
    // 日報5『サーバー接続エラー、ネットワーク遅延、メモリ不足』
    const mockKeywordFrequencies = {
      'サーバー接続エラー': 4,
      'ネットワーク遅延': 3,
      'メモリ不足': 3,
    };

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            normalizedKeyword: 'サーバー接続エラー',
            frequency: 4,
          },
          {
            normalizedKeyword: 'ネットワーク遅延',
            frequency: 3,
          },
          {
            normalizedKeyword: 'メモリ不足',
            frequency: 3,
          },
        ],
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: testTeamId,
      startDate: startDate,
      endDate: endDate,
      minFrequencyThreshold: 1,
      requestUserId: testUserId,
    };

    // 課題キーワード自動抽出・ランク付けロジックを実行
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter as any
    );

    // ランク付け結果が『1位:サーバー接続エラー（頻度4）、2位:ネットワーク遅延（頻度3）、3位:メモリ不足（頻度3）』の順序で返却されることを確認
    expect(result.keywords).toHaveLength(3);
    
    // 1位: サーバー接続エラー（頻度4）
    expect(result.keywords[0].keyword).toBe('サーバー接続エラー');
    expect(result.keywords[0].frequency).toBe(4);
    expect(result.keywords[0].rank).toBe(1);

    // 2位: ネットワーク遅延（頻度3）
    expect(result.keywords[1].keyword).toBe('ネットワーク遅延');
    expect(result.keywords[1].frequency).toBe(3);
    expect(result.keywords[1].rank).toBe(2);

    // 3位: メモリ不足（頻度3）
    expect(result.keywords[2].keyword).toBe('メモリ不足');
    expect(result.keywords[2].frequency).toBe(3);
    expect(result.keywords[2].rank).toBe(3);

    // 全キーワード数が3であることを確認
    expect(result.totalKeywordCount).toBe(3);

    // 分析対象期間が7日であることを確認
    expect(result.analysisperiodDays).toBe(7);

    // 抽出処理の実行日時が記録されていることを確認
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());

    // キーワードIDが存在することを確認
    expect(result.keywords[0].keywordId).toBeDefined();
    expect(result.keywords[0].keywordId).toMatch(/^[a-zA-Z0-9_-]+$/);
    expect(result.keywords[1].keywordId).toBeDefined();
    expect(result.keywords[2].keywordId).toBeDefined();

    // TextAnalysisServiceAdapterの extractKeywords が呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: testTeamId,
        startDate: startDate,
        endDate: endDate,
      })
    );
  });
});