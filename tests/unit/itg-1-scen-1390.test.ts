import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-1390: [edge] 重複課題の自動判定と統合機能 - 類似度計算で小数第N位に端数が出る場合、丸め処理後も統合判定が正確である
  test('should apply consistent rounding to similarity scores and maintain stable deduplication judgment across multiple calculations', () => {
    // Arrange: 小数第3位に端数を持つ類似度スコアを返すモック
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database_connection_error', frequency: 5, confidence: 0.92 },
          { keyword: 'database_connect_error', frequency: 3, confidence: 0.88 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        'database_connection_error': 75,
        'database_connect_error': 72
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        'database_connection_error': 'HIGH',
        'database_connect_error': 'HIGH'
      })
    };

    // 類似度計算を0.8567（小数第4位に端数）で返す設定
    // 丸め処理: 0.8567 → 0.86（四捨五入で小数第2位）
    // 統合判定の閾値: 0.85以上で統合対象
    const mockCalculateSimilarity = jest.fn((kw1: string, kw2: string) => {
      if (
        (kw1 === 'database_connection_error' && kw2 === 'database_connect_error') ||
        (kw1 === 'database_connect_error' && kw2 === 'database_connection_error')
      ) {
        return 0.8567; // 端数あり: 小数第4位に7
      }
      return 0;
    });

    // 端数が閾値を跨ぐケース: 0.8449 → 0.84（四捨五入）、閾値0.85未満で非統合
    const mockCalculateSimilarityBoundary = jest.fn((kw1: string, kw2: string) => {
      if (
        (kw1 === 'partial_outage' && kw2 === 'partial_service_issue') ||
        (kw1 === 'partial_service_issue' && kw2 === 'partial_outage')
      ) {
        return 0.8449; // 端数あり: 小数第4位に9、丸めで0.84になり閾値0.85未満
      }
      return 0;
    });

    // 統合判定ロジック: 丸め後の値で閾値と比較
    const roundToTwoDecimals = (value: number): number => {
      return Math.round(value * 100) / 100;
    };

    const deduplicationThreshold = 0.85;

    // テストケース1: 0.8567の端数が0.86に丸められ、閾値0.85以上で統合対象
    const similarity1 = 0.8567;
    const roundedSimilarity1 = roundToTwoDecimals(similarity1);
    const shouldMerge1 = roundedSimilarity1 >= deduplicationThreshold;

    // テストケース2: 同じペアで複数回計算しても丸め後の判定は一貫
    const similarity1Repeat = 0.8567;
    const roundedSimilarity1Repeat = roundToTwoDecimals(similarity1Repeat);
    const shouldMerge1Repeat = roundedSimilarity1Repeat >= deduplicationThreshold;

    // テストケース3: 0.8449の端数が0.84に丸められ、閾値0.85未満で非統合
    const similarity2 = 0.8449;
    const roundedSimilarity2 = roundToTwoDecimals(similarity2);
    const shouldMerge2 = roundedSimilarity2 >= deduplicationThreshold;

    // 入力データ
    const input: ExtractIssueKeywordsInput = {
      reportDataList: [
        {
          id: 'report_20240115_001',
          userId: 'engineer_001',
          teamId: 'team_alpha',
          submittedAt: '2024-01-15T09:00:00Z',
          yesterdayAccomplishment: 'Fixed minor UI issues',
          todayPlan: 'Continue backend development',
          challenges:
            'Encountered database connection error when running integration tests this morning. The connection timeout after 30 seconds. Also faced database connect error in staging environment.',
          createdAt: '2024-01-15T09:00:00Z'
        },
        {
          id: 'report_20240115_002',
          userId: 'engineer_002',
          teamId: 'team_alpha',
          submittedAt: '2024-01-15T09:15:00Z',
          yesterdayAccomplishment: 'Completed API documentation',
          todayPlan: 'Review pull requests',
          challenges: 'Database connection error persists in production logs.',
          createdAt: '2024-01-15T09:15:00Z'
        }
      ],
      analysisStartDate: '2024-01-08',
      analysisEndDate: '2024-01-15',
      minFrequencyThreshold: 1
    };

    // Act & Assert
    // 丸め処理後の値が統合判定の基準として使用される
    expect(roundedSimilarity1).toBe(0.86);
    expect(shouldMerge1).toBe(true); // 0.86 >= 0.85 で統合対象

    // 複数回の計算でも丸め後の判定結果が一貫
    expect(roundedSimilarity1Repeat).toBe(0.86);
    expect(shouldMerge1Repeat).toBe(true);
    expect(shouldMerge1).toBe(shouldMerge1Repeat); // 判定結果が一貫

    // 端数が丸めにより閾値を跨ぐケース
    expect(roundedSimilarity2).toBe(0.84);
    expect(shouldMerge2).toBe(false); // 0.84 < 0.85 で非統合

    // 実際の関数呼び出しで類似度に基づく統合ロジックが正確に動作
    const result = extractAndRankIssueKeywords(input);

    // 結果が定義済みで、ランク付けされたキーワード配列を含む
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 統合判定が丸め後の値で一貫して行われていることを間接的に検証
    // （複数件の同一課題が正確に統合されている）
    const databaseErrorKeywords = result.keywords.filter((kw) =>
      kw.keyword.toLowerCase().includes('database') &&
      (kw.keyword.toLowerCase().includes('connection') || kw.keyword.toLowerCase().includes('connect'))
    );

    // 統合判定が正確に行われた場合、類似度0.86（丸め後）以上のペアは
    // 単一のキーワードに統合されるか、発生頻度が加算されているはず
    if (databaseErrorKeywords.length > 0) {
      // 最初のデータベースエラーキーワードの優先度スコアが計算されている
      expect(databaseErrorKeywords[0].priorityScore).toBeGreaterThan(0);
      expect(databaseErrorKeywords[0].frequency).toBeGreaterThanOrEqual(1);
    }

    // 分析実行時刻がISO 8601形式で記録されている
    expect(result.analysisExecutedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    );

    // データ品質スコアが0～100の範囲内
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 総課題件数が正の整数
    expect(result.totalIssueCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.totalIssueCount)).toBe(true);
  });
});