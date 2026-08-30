import { calculateProductivityMetrics } from "../../src/logic/productivity-metrics-calculation";

describe("朝会報告管理システム - 生産性指標計算", () => {
  // SCEN-553: [edge] 指定された集約期間内の日報データから課題解決速度、提出率、課題再発率を定量化し、生産性指標を計算する - 提出日報件数が期待件数の50%未満のときという明示された境界条件でデータ提出率が著しく低いため、分析結果の信頼度が低下します
  test("should calculate productivity metrics with low data completeness and return warning flags when submission rate is below 50%", () => {
    const aggregationStartDate = new Date("2024-01-01");
    const aggregationEndDate = new Date("2024-01-31");
    const targetTeamIds = ["team-001"];

    const businessDays = 20;
    const teamSize = 10;
    const expectedSubmissionCount = businessDays * teamSize;
    const totalReportCount = 95;

    const extractedIssueCount = 12;
    const issueFrequencyDistribution = {
      対応遅延: 5,
      認識不足: 4,
      リソース不足: 3,
    };

    const improvementMeasures = [
      { title: "朝会リマインド強化", estimatedImpact: 75, resourceRequired: 20 },
      { title: "報告テンプレート改善", estimatedImpact: 60, resourceRequired: 15 },
    ];

    const managerReviewThreshold = 70;

    const result = calculateProductivityMetrics({
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      expectedSubmissionCount,
      totalReportCount,
      extractedIssueCount,
      issueFrequencyDistribution,
      improvementMeasures,
      managerReviewThreshold,
    });

    const expectedDataCompletenessRatio = 95 / 200;
    expect(result.dataCompletenessRatio).toBe(0.475);

    const issueKeywordCount = 3;
    const frequencyVariance = Math.sqrt(
      (Math.pow(5 - 4, 2) + Math.pow(4 - 4, 2) + Math.pow(3 - 4, 2)) / 3
    );
    const expectedIssueExtractionConfidence =
      Math.min(100, 50 + issueKeywordCount * 5 - frequencyVariance * 2);
    expect(result.issueExtractionConfidence).toBeGreaterThanOrEqual(61);
    expect(result.issueExtractionConfidence).toBeLessThan(70);

    const avgImpactScore = (75 + 60) / 2;
    const avgResourceRequired = (20 + 15) / 2;
    const expectedImprovementMeasuresFeasibility = (avgImpactScore / avgResourceRequired) * 100;
    expect(result.improvementMeasuresFeasibility).toBeGreaterThanOrEqual(65);
    expect(result.improvementMeasuresFeasibility).toBeLessThan(70);

    const dataCompletenessComponent = 0.475 * 0.4;
    const issueExtractionComponent = result.issueExtractionConfidence * 0.0035;
    const improvementMeasuresComponent =
      result.improvementMeasuresFeasibility * 0.0025;
    const expectedTrustworthinessScore =
      (dataCompletenessComponent +
        issueExtractionComponent +
        improvementMeasuresComponent) *
      100;

    expect(result.trustworthinessScore).toBeGreaterThanOrEqual(60);
    expect(result.trustworthinessScore).toBeLessThan(65);

    expect(result.reportApproved).toBe(false);
    expect(result.recommendedAction).toBe("追加分析が必要");

    expect(result.warningFlags).toContain(
      "データ提出率が著しく低いため、分析結果の信頼度が低下します"
    );
    expect(Array.isArray(result.warningFlags)).toBe(true);
    expect(result.warningFlags.length).toBeGreaterThan(0);
  });
});