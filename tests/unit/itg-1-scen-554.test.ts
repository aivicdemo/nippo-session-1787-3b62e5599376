import { calculateProductivityMetrics } from "../../src/logic/productivity-metrics-calculation";

describe("朝会報告管理システム", () => {
  // SCEN-554
  test("指定された集約期間内の日報データから課題解決速度、提出率、課題再発率を定量化し、生産性指標を計算する - 抽出された課題件数がゼロのときという明示された境界条件で課題が検出されませんでした。報告内容を確認してください", () => {
    const aggregationStartDate = new Date("2024-01-01T00:00:00Z");
    const aggregationEndDate = new Date("2024-01-31T23:59:59Z");
    const targetTeamIds = ["team-001"];
    const excludeOutliers = false;

    const result = calculateProductivityMetrics({
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers,
    });

    // extractedIssueCount = 0 のため、warningFlags に指定文言が含まれることを検証
    expect(result.warningFlags).toContain(
      "課題が検出されませんでした。報告内容を確認してください"
    );

    // extractedIssueCount = 0 のため、recommendedAction = "追加分析が必要"
    expect(result.recommendedAction).toBe("追加分析が必要");

    // trustworthinessScore は 0 から 50 の間の値
    expect(result.trustworthinessScore).toBeGreaterThanOrEqual(0);
    expect(result.trustworthinessScore).toBeLessThanOrEqual(50);

    // managerReviewThreshold（70）未満のため reportApproved = false
    expect(result.reportApproved).toBe(false);

    // issueExtractionConfidence = 0
    expect(result.issueExtractionConfidence).toBe(0);

    // dataCompletenessScore は算出される（完全性は満たされている）
    expect(typeof result.dataCompletenessScore).toBe("number");
    expect(result.dataCompletenessScore).toBeGreaterThanOrEqual(0);
    expect(result.dataCompletenessScore).toBeLessThanOrEqual(100);

    // improvementMeasureRealizabilityScore は算出される
    expect(typeof result.improvementMeasureRealizabilityScore).toBe("number");
    expect(result.improvementMeasureRealizabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.improvementMeasureRealizabilityScore).toBeLessThanOrEqual(100);

    // 設計済みエラーは発生しない
    expect(result.errorOccurred).toBe(false);
  });
});