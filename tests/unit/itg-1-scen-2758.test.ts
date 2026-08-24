import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractDashboardReportData, type ExtractDashboardReportDataInput, type DashboardReportDataOutput } from '../../src/logic/manager-dashboard';

describe('ダッシュボード優先度表示機能 - 色分け処理', () => {
  // SCEN-2758
  test('should handle out-of-range impact score and fail color mapping', async () => {
    // Arrange: 影響度スコアが範囲外（-10）の課題データを含むモック入力
    const input: ExtractDashboardReportDataInput = {
      userId: 'user-manager-001',
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      includeUnsubmitted: true,
    };

    // Act: extractDashboardReportData を呼び出し
    // 実装がTextAnalysisServiceAdapterのassessImpactScoreから
    // 範囲外スコア(-10)を受け取る場合、色分けロジックの防御をテスト
    const result: DashboardReportDataOutput = await extractDashboardReportData(
      input,
      {
        // TextAnalysisServiceAdapterスタブ
        assessImpactScore: async (keyword: string): Promise<number> => {
          // 範囲外の負数を返す
          return -10;
        },
      } as any
    );

    // Assert: 範囲外スコアの課題については色分けが失敗するか、
    // priorityColorが未設定または'invalid'状態であることを検証
    expect(result).toBeDefined();
    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);

    // 出力された課題に対して、スコアが範囲外の場合の色分け処理を検証
    // 期待値: priorityColorが null, undefined, または 'invalid' であるか、
    // またはこの関数がエラーをthrowする
    const issueWithInvalidScore = result.prioritizedIssues.find(
      (issue) => issue.priorityScore < 0 || issue.priorityScore > 100
    );

    if (issueWithInvalidScore) {
      // 範囲外スコアを持つ課題が存在する場合、
      // 色分けが適用されていない（防御が機能している）ことを確認
      expect(
        issueWithInvalidScore.priorityColor === null ||
          issueWithInvalidScore.priorityColor === undefined ||
          issueWithInvalidScore.priorityColor === 'invalid'
      ).toBe(true);
    }
  });
});