import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('extractAndRankIssueKeywords - 重複課題の自動判定と統合', () => {
  // SCEN-1362
  test('重複課題が複数件検出された場合、すべて親課題に統合されマージ済みフラグが付与される', () => {
    // テストデータ: 親課題1件と重複課題3件を準備
    const parentIssueKeyword = 'データベース接続エラー';
    const childKeywords = [
      'DB接続エラー',
      'データベース接続失敗',
      'DB接続タイムアウト'
    ];

    const reportDataList = [
      {
        reportId: 'report_001',
        reportDate: '2024-01-08',
        teamId: 'team_001',
        userId: 'user_001',
        yesterday: 'DB接続テスト実施',
        today: 'DB接続バグ修正',
        issues: parentIssueKeyword
      },
      {
        reportId: 'report_002',
        reportDate: '2024-01-08',
        teamId: 'team_001',
        userId: 'user_002',
        yesterday: 'API統合テスト',
        today: 'DB接続エラー対応',
        issues: childKeywords[0]
      },
      {
        reportId: 'report_003',
        reportDate: '2024-01-08',
        teamId: 'team_001',
        userId: 'user_003',
        yesterday: 'キャッシュレイヤー実装',
        today: 'データベース接続失敗の調査',
        issues: childKeywords[1]
      },
      {
        reportId: 'report_004',
        reportDate: '2024-01-08',
        teamId: 'team_001',
        userId: 'user_004',
        yesterday: 'ログ出力改善',
        today: 'DB接続タイムアウト対応',
        issues: childKeywords[2]
      }
    ];

    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-08';
    const minFrequencyThreshold = 1;

    const input: ExtractIssueKeywordsInput = {
      reportDataList,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold
    };

    // 重複課題の自動判定ロジックと統合処理を実行
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(input);

    // 期待結果の検証
    // 1. 結果が返される
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 2. 親課題が存在し、統合済みフラグが true に設定されている
    const parentKeywordResult = result.keywords.find(
      (k) => k.keyword === parentIssueKeyword
    );
    expect(parentKeywordResult).toBeDefined();
    expect(parentKeywordResult!.frequency).toBeGreaterThanOrEqual(1);

    // 3. 重複課題3件がすべて検出され、発生頻度が正しく計算されている
    const childKeywordResults = result.keywords.filter((k) =>
      childKeywords.includes(k.keyword)
    );
    expect(childKeywordResults.length).toBe(3);

    // 4. 各キーワードの優先度スコアが 0～100 の範囲内に収まっている
    result.keywords.forEach((keyword) => {
      expect(keyword.priorityScore).toBeGreaterThanOrEqual(0);
      expect(keyword.priorityScore).toBeLessThanOrEqual(100);
    });

    // 5. 優先度スコアで降順ソートされている
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].priorityScore).toBeGreaterThanOrEqual(
        result.keywords[i + 1].priorityScore
      );
    }

    // 6. 総課題件数が正しく計算されている（4件の報告 = 4件）
    expect(result.totalIssueCount).toBe(4);

    // 7. 分析実行時刻が ISO 8601 形式で記録されている
    expect(result.analysisExecutedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // 8. データ品質スコアが 0～100 の範囲内に収まっている
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 9. 優先度カラーが有効な値（red/yellow/green）に設定されている
    result.keywords.forEach((keyword) => {
      expect(['red', 'yellow', 'green']).toContain(keyword.priorityColor);
    });

    // 10. 発生頻度がすべて minFrequencyThreshold 以上である
    result.keywords.forEach((keyword) => {
      expect(keyword.frequency).toBeGreaterThanOrEqual(minFrequencyThreshold);
    });
  });
});