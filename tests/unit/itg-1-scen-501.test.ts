import { validateReportQuality } from "../../src/logic/report-quality-validation";

describe("朝会報告管理システム - レポート品質検証", () => {
  // SCEN-501: 生成されたレポートの完全性・正確性・有用性を検証し、基準未達時に修正指示を返す - 課題IDが1件も選択されていない境界条件
  test("should throw error when targetIssueIds is empty array", () => {
    const reportQualityValidationInput = {
      reportId: "report-20240115-001",
      reportContent: {
        sections: ["summary", "issues", "metrics"],
        issueData: [
          {
            keyword: "ビルド失敗",
            frequency: 5,
            affectedMembers: ["eng-001", "eng-002", "eng-003"],
          },
        ],
        metrics: {
          totalIssueCount: 1,
          averageResolutionDays: 2.5,
          teamProductivityScore: 78,
        },
      },
      sourceReportDataset: {
        dailyReports: [
          {
            employeeId: "eng-001",
            reportDate: "2024-01-14",
            issues: "ビルド失敗が発生",
          },
          {
            employeeId: "eng-002",
            reportDate: "2024-01-14",
            issues: "ビルド失敗のため進捗が遅れている",
          },
          {
            employeeId: "eng-003",
            reportDate: "2024-01-14",
            issues: "ビルドプロセス全体の見直しが必要",
          },
        ],
      },
      validationCriteria: {
        requiredSections: ["summary", "issues", "metrics"],
        accuracyThreshold: 95,
        requiredUtilityElements: [
          "issue_analysis",
          "impact_assessment",
          "recommended_actions",
        ],
      },
    };

    const executionPlanData = {
      planTitle: "ビルドプロセスの自動化",
      targetIssueIds: [],
      expectedImpact: "ビルド時間を30分短縮",
      implementationSteps: [
        {
          stepNumber: 1,
          description: "CI/CDパイプラインの設定",
          owner: "eng-lead-001",
          deadline: "2024-01-20",
        },
        {
          stepNumber: 2,
          description: "テスト自動化スクリプトの作成",
          owner: "eng-lead-001",
          deadline: "2024-01-25",
        },
      ],
      resourcesRequired: "CI/CDツール、エンジニア2名",
      riskAssessment:
        "既存ジョブとの競合リスク。対応：段階的なロールアウト",
      submittedBy: "pm-001",
      submittedAt: new Date("2024-01-15T10:30:00Z"),
    };

    expect(() => {
      validateReportQuality(reportQualityValidationInput, executionPlanData);
    }).toThrow(/この対策で解決する課題を最低 1 件選択してください/);
  });
});