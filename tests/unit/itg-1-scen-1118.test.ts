import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-1118: [normal] 抽出課題データのノイズ検出機能 - 出現頻度が閾値以下の課題キーワードがノイズとして判定される
  test('出現頻度が最小閾値未満の課題キーワードをノイズとして判定し、有効なキーワードのみランク付けして返す', async () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを準備
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keywordId: 'kw-001',
          keyword: 'DB接続エラー',
          frequency: 3,
        },
        {
          keywordId: 'kw-002',
          keyword: 'ログ出力失敗',
          frequency: 2,
        },
        {
          keywordId: 'kw-003',
          keyword: 'UI表示遅延',
          frequency: 1,
        },
      ]),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 2,
      requestUserId: 'user-001',
    };

    // Act: ノイズ検出機能を実行
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert: 出現頻度が閾値以上のキーワードのみが返却され、ランク付けされていることを確認
    expect(result.keywords).toHaveLength(2);
    
    // ランク1: DB接続エラー（頻度3回）
    expect(result.keywords[0].keywordId).toBe('kw-001');
    expect(result.keywords[0].keyword).toBe('DB接続エラー');
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[0].rank).toBe(1);
    
    // ランク2: ログ出力失敗（頻度2回）
    expect(result.keywords[1].keywordId).toBe('kw-002');
    expect(result.keywords[1].keyword).toBe('ログ出力失敗');
    expect(result.keywords[1].frequency).toBe(2);
    expect(result.keywords[1].rank).toBe(2);
    
    // 全キーワード数（フィルタ前）は3
    expect(result.totalKeywordCount).toBe(3);
    
    // ノイズ判定されたUI表示遅延（頻度1回）は結果に含まれない
    expect(result.keywords.some(kw => kw.keyword === 'UI表示遅延')).toBe(false);
    
    // 抽出処理実行日時が記録されている
    expect(result.extractedAt).toBeInstanceOf(Date);
    
    // 分析対象期間の日数は7日
    expect(result.analysisperiodDays).toBe(7);
  });
});