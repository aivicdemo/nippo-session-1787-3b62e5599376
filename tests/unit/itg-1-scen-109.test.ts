import { validateProductivityAnalysisDataQuality } from "../../src/logic/productivity-metrics-calculation";
import { type ProductivityAnalysisDataset } from "../../src/logic/productivity-metrics-calculation";

describe("朝会報告管理システム - 分析データ品質検証", () => {
  // SCEN-109: [normal] 分析対象期間のデータ完全性、課題抽出精度、改善施策実行可能性を総合判定し、報告可否を決定する
  test("validateProductivityAnalysisDataQualityが代表的な正常入力を設計どおり処理する", () => {
    // テストデータ準備：分析対象期間を2024年4月1日～2024年4月30日に設定
    const aggregationPeriodStartDate = new Date("2024-04-01T00:00:00Z");
    const aggregationPeriodEndDate = new Date("2024-04-30T23:59:59Z");
    const teamMemberCount = 10;

    // reportDatasetを構築：提出率85%相当となる日報レコード9件を生成
    const reportDataset = [
      {
        reporterId: "ENG001",
        submittedAt: new Date("2024-04-01T08:30:00Z"),
        issueContent: "バグ修正に時間がかかっている",
      },
      {
        reporterId: "ENG002",
        submittedAt: new Date("2024-04-02T08:45:00Z"),
        issueContent: "ビルドエラーが頻繁に発生",
      },
      {
        reporterId: "ENG003",
        submittedAt: new Date("2024-04-03T09:00:00Z"),
        issueContent: "テスト環境が不安定",
      },
      {
        reporterId: "ENG004",
        submittedAt: new Date("2024-04-04T08:30:00Z"),
        issueContent: "リソース不足で対応が遅延",
      },
      {
        reporterId: "ENG005",
        submittedAt: new Date("2024-04-05T08:45:00Z"),
        issueContent: "依存ライブラリの更新に伴う不具合",
      },
      {
        reporterId: "ENG006",
        submittedAt: new Date("2024-04-08T09:00:00Z"),
        issueContent: "テストケース不足",
      },
      {
        reporterId: "ENG007",
        submittedAt: new Date("2024-04-09T08:30:00Z"),
        issueContent: "レビュー待ちの案件が溜まっている",
      },
      {
        reporterId: "ENG008",
        submittedAt: new Date("2024-04-10T08:45:00Z"),
        issueContent: "パフォーマンス改善が必要",
      },
      {
        reporterId: "ENG009",
        submittedAt: new Date("2024-04-11T09:00:00Z"),
        issueContent: "ドキュメント整備の遅れ",
      },
    ];

    // extractedIssueDatasetを構築：抽出された課題レコード8件を生成、有効課題率75%（6件/8件）
    const extractedIssueDataset = [
      {
        issueId: "ISSUE001",
        keyword: "バグ",
        extractionSourceReportId: "REPORT001",
        isDuplicate: false,
        priorityScore: 85,
      },
      {
        issueId: "ISSUE002",
        keyword: "ビルドエラー",
        extractionSourceReportId: "REPORT002",
        isDuplicate: false,
        priorityScore: 90,
      },
      {
        issueId: "ISSUE003",
        keyword: "テスト環境",
        extractionSourceReportId: "REPORT003",
        isDuplicate: false,
        priorityScore: 75,
      },
      {
        issueId: "ISSUE004",
        keyword: "リソース不足",
        extractionSourceReportId: "REPORT004",
        isDuplicate: false,
        priorityScore: 80,
      },
      {
        issueId: "ISSUE005",
        keyword: "依存ライブラリ",
        extractionSourceReportId: "REPORT005",
        isDuplicate: false,
        priorityScore: 65,
      },
      {
        issueId: "ISSUE006",
        keyword: "テストケース",
        extractionSourceReportId: "REPORT006",
        isDuplicate: false,
        priorityScore: 70,
      },
      {
        issueId: "ISSUE007",
        keyword: "バグ",
        extractionSourceReportId: "REPORT007",
        isDuplicate: true,
        priorityScore: 0,
      },
      {
        issueId: "ISSUE008",
        keyword: "パフォーマンス",
        extractionSourceReportId: "REPORT008",
        isDuplicate: true,
        priorityScore: 0,
      },
    ];

    // proposedImprovementMeasuresを構築：改善施策5件、全施策の実行可能性スコアが60%以上
    const proposedImprovementMeasures = [
      {
        measureId: "MEASURE001",
        description: "自動テスト環境の構築",
        estimatedImplementationDays: 10,
        realizabilityScore: 70,
      },
      {
        measureId: "MEASURE002",
        description: "CI/CDパイプラインの最適化",
        estimatedImplementationDays: 15,
        realizabilityScore: 75,
      },
      {
        measureId: "MEASURE003",
        description: "チーム内のコードレビュープロセス改善",
        estimatedImplementationDays: 5,
        realizabilityScore: 65,
      },
      {
        measureId: "MEASURE004",
        description: "ドキュメンテーション自動化ツール導入",
        estimatedImplementationDays: 8,
        realizabilityScore: 80,
      },
      {
        measureId: "MEASURE005",
        description: "パフォーマンス監視ダッシュボード構築",
        estimatedImplementationDays: 12,
        realizabilityScore: 72,
      },
    ];

    // ProductivityAnalysisDatasetオブジェクトを構成
    const analysisDataset: ProductivityAnalysisDataset = {
      aggregationPeriodStartDate,
      aggregationPeriodEndDate,
      reportDataset,
      extractedIssueDataset,
      proposedImprovementMeasures,
      teamMemberCount,
    };

    // validateProductivityAnalysisDataQualityを呼び出し
    const result = validateProductivityAnalysisDataQuality(analysisDataset);

    // 期待結果の検証
    // isValidがtrueを返す
    expect(result.isValid).toBe(true);

    // validRecordCountが9（品質基準を満たす日報レコード件数）
    expect(result.validRecordCount).toBe(9);

    // invalidRecordCountが0
    expect(result.invalidRecordCount).toBe(0);

    // validationErrorsが空配列
    expect(result.validationErrors).toEqual([]);

    // 提出率85%（≥80%基準）が満たされていることを確認
    // 提出率 = 9件 / 10名 * 100 = 90% (修正: 実際の計算では営業日数を考慮する場合もあるが、ここでは単純に提出者数で計算)
    expect(result.submissionRatePercentage).toBeGreaterThanOrEqual(80);

    // 課題抽出件数8件（≥0件基準）を確認
    expect(result.extractedIssueCount).toBe(8);

    // 抽出精度スコア75%（有効課題6件/全課題8件、≥75%基準）を確認
    expect(result.extractionAccuracyScore).toBe(75);

    // 改善施策実行可能性スコアの平均72.4%を確認
    // (70 + 75 + 65 + 80 + 72) / 5 = 362 / 5 = 72.4
    expect(result.improvementMeasureRealizabilityScore).toBeCloseTo(72.4, 1);

    // 全施策が60%以上の実行可能性スコアを持つことを確認
    expect(result.improvementMeasuresAllAboveThreshold).toBe(true);
  });
});