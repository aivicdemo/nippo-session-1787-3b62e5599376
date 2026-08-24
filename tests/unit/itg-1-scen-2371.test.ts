import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";
import type { MonthlyExtractionRequest, MonthlyReportDataset, ExtractionValidationResult } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告集約分析機能 - 課題キーワード抽出エラーハンドリング", () => {
  // SCEN-2371
  it("抽出された課題キーワードが0件のときエラーをthrowする", async () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを作成
    const stubTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // テストデータ: 3件の部員日報
    const testReports = [
      {
        reportId: "report-001",
        reporterId: "engineer-001",
        yesterdayAccomplishment: "APIエンドポイント実装完了",
        todayPlan: "単体テスト実装",
        issueSummary: "データベース接続タイムアウト問題",
        submittedAt: new Date("2024-01-15T08:30:00Z"),
      },
      {
        reportId: "report-002",
        reporterId: "engineer-002",
        yesterdayAccomplishment: "フロントエンド画面修正",
        todayPlan: "統合テスト準備",
        issueSummary: "ビルドエラー発生",
        submittedAt: new Date("2024-01-15T08:35:00Z"),
      },
      {
        reportId: "report-003",
        reporterId: "engineer-003",
        yesterdayAccomplishment: "ドキュメント作成",
        todayPlan: "レビュー対応",
        issueSummary: "キャッシュ層の最適化が必要",
        submittedAt: new Date("2024-01-15T08:40:00Z"),
      },
    ];

    const extractionRequest: MonthlyExtractionRequest = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: "manager-001",
      teamIdFilter: ["team-dev"],
    };

    // Act & Assert: extractKeywordsが空配列を返すとき、エラーがthrowされることを検証
    const extractMonthlyDataWithAdapter = async () => {
      return extractMonthlyReportData(extractionRequest, {
        textAnalysisAdapter: stubTextAnalysisAdapter,
        reportRecords: testReports,
      } as any);
    };

    await expect(extractMonthlyDataWithAdapter()).rejects.toThrow(
      /抽出された課題キーワードが0件です/
    );

    // extractKeywordsが呼び出されたことを確認
    expect(stubTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    // その後のassessImpactScoreやclassifyIssueSeverityが呼び出されていないことを確認
    expect(stubTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(
      stubTextAnalysisAdapter.classifyIssueSeverity
    ).not.toHaveBeenCalled();
  });
});