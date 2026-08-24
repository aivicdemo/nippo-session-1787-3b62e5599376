import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Deduplication of Manual and Auto-Extracted Issues', () => {
  // SCEN-1168: [edge] 課題データ有効性検証機能 - 既存ツール連携対象の課題確定時に、同一課題が手動確定済みと自動抽出結果に重複していても1件に統合される
  test('should deduplicate and merge manually confirmed issue with auto-extracted identical issue', async () => {
    // Arrange: テストデータの準備
    const teamId = 'team-001';
    const userId = 'user-A';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;

    // 手動確定済みの課題データ
    const manuallyConfirmedIssue = {
      keyword: 'データベース接続エラー',
      frequency: 1,
      isManuallyConfirmed: true,
      confirmedAt: new Date('2024-01-08T09:30:00Z'),
    };

    // TextAnalysisServiceAdapter のスタブ - 同一の課題を自動抽出結果として返す
    const textAnalysisStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 1,
            confidence: 0.95,
          },
          {
            keyword: 'ネットワークタイムアウト',
            frequency: 1,
            confidence: 0.88,
          },
        ],
      }),
    };

    // 入力パラメータ
    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId: userId,
      existingConfirmedIssues: [manuallyConfirmedIssue],
      textAnalysisAdapter: textAnalysisStub,
    };

    // Act: 課題キーワード抽出・ランク付け処理を実行
    const result = await extractAndRankIssueKeywords(input);

    // Assert: 結果を検証
    // 1. 統合後のキーワード一覧から重複が排除されていることを確認
    expect(result.keywords).toHaveLength(2);

    // 2. 『データベース接続エラー』のキーワードが1件のみ存在することを確認
    const databaseErrorKeyword = result.keywords.find(
      (kw) => kw.keyword === 'データベース接続エラー'
    );
    expect(databaseErrorKeyword).toBeDefined();
    expect(databaseErrorKeyword?.rank).toBe(1);
    expect(databaseErrorKeyword?.frequency).toBe(1);

    // 3. ネットワークタイムアウトも含まれていることを確認
    const networkTimeoutKeyword = result.keywords.find(
      (kw) => kw.keyword === 'ネットワークタイムアウト'
    );
    expect(networkTimeoutKeyword).toBeDefined();

    // 4. 全キーワード数がフィルタ前の実際の抽出数と一致することを確認
    expect(result.totalKeywordCount).toBe(2);

    // 5. 抽出処理が実行された日時が記録されていることを確認
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 6. 分析対象期間の日数が正しく計算されていることを確認
    const expectedDays = 7;
    expect(result.analysisperiodDays).toBe(expectedDays);

    // 7. 手動確定済みキーワードが統合されたことを確認
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
    expect(result.keywords[0].frequency).toBe(1);
  });
});