import { validateReportQuality } from "../../src/logic/report-quality-validation";
import { type ReportQualityValidationInput, type ReportQualityValidationResult } from "../../src/logic/report-quality-validation";

describe("Report Quality Validation", () => {
  // SCEN-504: [error] 生成されたレポートの完全性・正確性・有用性を検証し、品質基準を満たすかを判定して、基準未達の場合は修正指示内容を返す - 必要リソースが空の場合という明示された境界条件で必要なリソースを入力してください
  test("should throw error when resourcesRequired is empty string", () => {
    const validationInput: ReportQualityValidationInput = {
      reportId: "report-001",
      reportContent: {
        sections: [
          {
            name: "Executive Summary",
            content: "Weekly report summary"
          }
        ],
        data: {
          aggregatedMetrics: {
            totalIssueCount: 5,
            averagePriorityScore: 65
          }
        },
        analysisResults: {
          trendAnalysis: "Issues are increasing"
        }
      },
      sourceReportDataset: {
        reportDate: "2026-01-15",
        totalDailyReports: 10,
        issueOccurrences: [
          {
            keyword: "Build Failure",
            frequency: 5
          }
        ]
      },
      validationCriteria: {
        requiredSections: ["Executive Summary", "Issues", "Recommendations"],
        accuracyThreshold: 95,
        requiredUtilityElements: ["Metrics", "Trend Analysis", "Recommendations"]
      }
    };

    expect(() => validateReportQuality(validationInput)).toThrow(/リソース/);
  });
});