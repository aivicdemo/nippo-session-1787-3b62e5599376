import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx7Imp1Agent } from "../../src/agents/tx-7-imp-1/orchestrator";

describe("tx-7-imp-1 月次レポート生成エージェント", () => {
  // SCEN-023
  test("生成されたレポートが品質基準を満たさない場合、AnalysisResultValidationFailedException を発生させる", async () => {
    const mockAiClient = {
      executeAction: jest.fn(),
    };

    const mockDependencies = {
      aggregateReportsByPeriod: jest.fn().mockResolvedValue([
        {
          memberId: "emp-001",
          reportDate: "2024-01-15",
          issueText: "バグが多発している",
          yesterday: "デバッグ作業",
          today: "テスト実行",
        },
        {
          memberId: "emp-002",
          reportDate: "2024-01-15",
          issueText: "遅延が発生",
          yesterday: "レビュー",
          today: "修正",
        },
      ]),
      generateMonthlyAnalysisReport: jest.fn().mockResolvedValue({
        reportId: "report-001",
        analysisResult: {
          issueTimeSeriesChange: [
            {
              keyword: "バグ",
              dailyOccurrence: [1, 2, 3, 2],
            },
          ],
          bottleneckProgression: [
            {
              week: 1,
              mainIssue: "バグ",
              resolutionStatus: "ongoing",
            },
          ],
          teamPerformanceMetrics: [
            {
              teamId: "team-001",
              submissionRate: 80,
              issueResolutionSpeed: 3.5,
              averageIssuesPerMember: 1.2,
            },
          ],
        },
        prioritizedIssueList: [
          {
            keyword: "バグ",
            frequency: 8,
            impactScore: 65,
            priority: "high",
          },
        ],
      }),
      validateReportQuality: jest.fn().mockResolvedValue({
        isValid: false,
        validationStatus: "rejected",
        reasons: [
          "完全性: 30%以上のチームデータが不足",
          "正確性: 課題カテゴリ分類に矛盾あり",
          "有用性: 業務改善案が不十分",
        ],
      }),
    };

    const input = {
      aggregationPeriodStart: new Date("2024-01-01T00:00:00Z"),
      aggregationPeriodEnd: new Date("2024-01-31T23:59:59Z"),
      targetTeamIds: ["team-001"],
      reportOutputFormat: "詳細レポート",
      managerUserId: "manager-001",
    };

    await expect(
      runTx7Imp1Agent(input, mockAiClient, mockDependencies)
    ).rejects.toThrow(/品質基準/);
  });
});