import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { generateMonthlyAnalysisReport } from "../../src/logic/analysis-reporting";

describe("generateMonthlyAnalysisReport", () => {
  // SCEN-129: [normal] 月次レポート生成から分析完了までの自動実行 AIエージェント
  test("should execute Action 5 bottleneck timeline analysis and transition to Action 6 with valid anomaly detection", async () => {
    const mockReportingData = [
      {
        reportId: "rep001",
        date: "2024-01-08",
        week: 1,
        teamId: "team_x",
        issues: [
          {
            id: "issue_a",
            title: "課題A",
            category: "performance",
            severity: 8,
            affectedTeams: ["チームX"],
          },
        ],
      },
      {
        reportId: "rep002",
        date: "2024-01-15",
        week: 2,
        teamId: "team_x",
        issues: [
          {
            id: "issue_a",
            title: "課題A",
            category: "performance",
            severity: 9,
            affectedTeams: ["チームX", "チームY"],
          },
        ],
      },
      {
        reportId: "rep003",
        date: "2024-01-22",
        week: 3,
        teamId: "team_y",
        issues: [
          {
            id: "issue_b",
            title: "課題B",
            category: "quality",
            severity: 7,
            affectedTeams: ["チームY"],
          },
        ],
      },
    ];

    const historicalAverageScore = 6.0;
    const deviationThreshold = 0.3;
    const allowedCategories = ["performance", "quality", "delivery", "security"];

    const result = await generateMonthlyAnalysisReport(mockReportingData, {
      historicalAverageScore,
      deviationThreshold,
      allowedCategories,
    });

    expect(result).toBeDefined();
    expect(result.bottleneckTimeline).toBeDefined();
    expect(Array.isArray(result.bottleneckTimeline)).toBe(true);
    expect(result.bottleneckTimeline.length).toBe(3);

    const week1Bottleneck = result.bottleneckTimeline[0];
    expect(week1Bottleneck.week).toBe(1);
    expect(week1Bottleneck.primaryBottleneck).toBe("課題A");
    expect(Array.isArray(week1Bottleneck.affectedTeams)).toBe(true);
    expect(week1Bottleneck.affectedTeams).toContain("チームX");
    expect(week1Bottleneck.impactScore).toBeDefined();
    expect(typeof week1Bottleneck.impactScore).toBe("number");

    const week2Bottleneck = result.bottleneckTimeline[1];
    expect(week2Bottleneck.week).toBe(2);
    expect(week2Bottleneck.primaryBottleneck).toBe("課題A");
    expect(week2Bottleneck.affectedTeams).toContain("チームX");
    expect(week2Bottleneck.affectedTeams).toContain("チームY");
    expect(week2Bottleneck.impactScore).toBeGreaterThan(week1Bottleneck.impactScore);

    const week3Bottleneck = result.bottleneckTimeline[2];
    expect(week3Bottleneck.week).toBe(3);
    expect(week3Bottleneck.primaryBottleneck).toBe("課題B");
    expect(week3Bottleneck.affectedTeams).toContain("チームY");

    expect(result.transitionAnalysis).toBeDefined();
    expect(typeof result.transitionAnalysis).toBe("string");
    expect(result.transitionAnalysis.length).toBeGreaterThan(0);

    for (const bottleneck of result.bottleneckTimeline) {
      const deviationRatio = Math.abs(bottleneck.impactScore - historicalAverageScore) / historicalAverageScore;
      expect(deviationRatio).toBeLessThanOrEqual(deviationThreshold);
    }

    const reportCategories = new Set<string>();
    mockReportingData.forEach((report) => {
      report.issues.forEach((issue) => {
        reportCategories.add(issue.category);
      });
    });
    for (const category of reportCategories) {
      expect(allowedCategories).toContain(category);
    }

    expect(result.actionSequenceStatus).toBeDefined();
    expect(result.actionSequenceStatus.completedActions).toContain("Action 5");
    expect(result.actionSequenceStatus.nextAction).toBe("Action 6");
    expect(result.actionSequenceStatus.hasAnomalies).toBe(false);

    const timelineWeeks = result.bottleneckTimeline.map((b) => b.week);
    for (let i = 1; i < timelineWeeks.length; i++) {
      expect(timelineWeeks[i]).toBeGreaterThanOrEqual(timelineWeeks[i - 1]);
    }
  });
});