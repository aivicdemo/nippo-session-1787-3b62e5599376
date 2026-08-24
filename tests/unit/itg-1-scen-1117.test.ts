import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Duplicate Detection', () => {
  // SCEN-1117: [normal] 抽出課題データの重複検出機能 - 出現パターンが異なる同義キーワードを重複として判定する
  test('should detect and normalize duplicate keywords with different expressions as a single unified issue', async () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続エラー',
          frequency: 1.0,
          sourceText: 'データベース接続エラーが発生している。DB接続の問題で処理が停止している'
        },
        {
          keyword: '接続',
          frequency: 0.8,
          sourceText: 'データベース接続エラーが発生している。DB接続の問題で処理が停止している'
        },
        {
          keyword: 'DB接続',
          frequency: 1.0,
          sourceText: 'DBリンク障害により業務が遅延。接続失敗が続いている'
        },
        {
          keyword: '接続失敗',
          frequency: 0.9,
          sourceText: 'DBリンク障害により業務が遅延。接続失敗が続いている'
        }
      ])
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123'
    };

    // Act: extractAndRankIssueKeywordsを実行
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    // Assert: 重複検出ロジックが複数の同義キーワードを1つの統一レコードに統合したことを検証
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 重複として判定されたキーワードが統合された確認
    // 「データベース接続エラー」「DB接続」「接続」「接続失敗」が同義キーワードセットとして認識され、
    // 1つの統一課題レコード（例：「接続関連エラー」）に正規化されたことを検証
    const normalizedConnectivityIssue = result.keywords.find(
      (kw) => kw.keyword === '接続関連エラー' || kw.keyword.includes('接続')
    );

    expect(normalizedConnectivityIssue).toBeDefined();
    if (normalizedConnectivityIssue) {
      // 統合前の複数キーワードの発生頻度が合算されていることを確認
      // 統合対象: 「データベース接続エラー」(1.0) + 「DB接続」(1.0) + 「接続」(0.8) + 「接続失敗」(0.9)
      // 期待される統合発生頻度: 3.7
      expect(normalizedConnectivityIssue.frequency).toBeCloseTo(3.7, 1);
    }

    // 抽出されたキーワード総数をアサート
    // 重複検出後、4つのキーワードが1つに統合されるため、最終的なランク付きキーワード数は減少する
    expect(result.totalKeywordCount).toBe(4);

    // 抽出処理の実行日時が記録されていることを検証
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 分析対象期間が7日であることを検証（1月1日～1月7日）
    expect(result.analysisperiodDays).toBe(7);

    // ランク付けが発生頻度の降順であることを検証
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency
      );
    }

    // rank フィールドが正しく付与されていることを検証（1位から開始）
    result.keywords.forEach((keyword, index) => {
      expect(keyword.rank).toBe(index + 1);
    });

    // モックの extractKeywords が呼び出されたことを確認
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalled();
  });
});