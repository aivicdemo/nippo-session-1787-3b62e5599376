import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能 - 月をまたぐ期間の抽出', () => {
  // SCEN-1654: 前週の日報が月をまたぐ場合、月初の日報も正しく抽出対象に含まれる
  test('should extract keywords from reports spanning month boundary', async () => {
    // テスト日付を1月31日に設定（月末日）
    const testCurrentDate = new Date('2024-01-31T09:00:00Z');
    
    // 前週の範囲：1月28日（月）〜2月3日（日）
    const startDate = new Date('2024-01-28T00:00:00Z');
    const endDate = new Date('2024-02-03T23:59:59Z');
    
    // TextAnalysisServiceAdapterのスタブ化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (reportText: string) => {
        // 日報テキストに応じてキーワードを抽出
        if (reportText.includes('DBコネクション切断問題')) {
          return {
            keywords: ['DBコネクション切断問題'],
            confidence: 0.95,
            extractedAt: new Date().toISOString(),
          };
        }
        return {
          keywords: [],
          confidence: 0,
          extractedAt: new Date().toISOString(),
        };
      }),
      assessImpactScore: jest.fn(async () => ({ impactScore: 75 })),
      classifyIssueSeverity: jest.fn(async () => ({ severity: 'high' })),
    };

    // テストデータ：1月28日、1月29日、2月1日（月初）の日報
    const reportData = [
      {
        reportDate: '2024-01-28',
        reportText: 'DBコネクション切断問題が発生',
        teamId: 'team-001',
        userId: 'user-001',
      },
      {
        reportDate: '2024-01-29',
        reportText: 'DBコネクション切断問題が再発',
        teamId: 'team-001',
        userId: 'user-002',
      },
      {
        reportDate: '2024-02-01',
        reportText: 'DBコネクション切断問題の根本原因調査完了',
        teamId: 'team-001',
        userId: 'user-003',
      },
    ];

    // 入力パラメータ
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId: 'manager-001',
    };

    // 課題キーワード自動抽出機能を実行
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      reportData
    );

    // 期待結果の検証
    // 1. 抽出されたキーワード一覧に「DBコネクション切断問題」が含まれる
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'DBコネクション切断問題',
        }),
      ])
    );

    // 2. 出現頻度が3回（1月28日、1月29日、2月1日）として記録される
    const dbConnectionKeyword = result.keywords.find(
      (k) => k.keyword === 'DBコネクション切断問題'
    );
    expect(dbConnectionKeyword).toBeDefined();
    expect(dbConnectionKeyword?.frequency).toBe(3);

    // 3. ランク付けが実行されている（rankフィールドが存在）
    expect(dbConnectionKeyword?.rank).toBe(1);

    // 4. 抽出処理の実行日時が記録されている
    expect(result.extractedAt).toBeDefined();
    expect(typeof result.extractedAt).toBe('object');

    // 5. 分析対象期間の日数が正しく計算されている（7日間）
    expect(result.analysisperiodDays).toBe(7);

    // 6. 全キーワード数が記録されている
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);

    // 7. 2月1日（月初・前月翌月境界）の日報も正しく抽出対象に含まれていることを確認
    // TextAnalysisServiceAdapterの呼び出し回数が3回であることを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
    
    // 各日報のテキストが正しく渡されていることを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenNthCalledWith(
      1,
      'DBコネクション切断問題が発生'
    );
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenNthCalledWith(
      2,
      'DBコネクション切断問題が再発'
    );
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenNthCalledWith(
      3,
      'DBコネクション切断問題の根本原因調査完了'
    );
  });
});