import { describe, it, expect } from "@jest/globals";
import { extractDashboardReportData } from "../../src/logic/manager-dashboard";
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
} from "../../src/logic/manager-dashboard";

describe("manager-dashboard.extractDashboardReportData", () => {
  // SCEN-2745: [normal] ダッシュボード表示機能 - 影響度スコア50～99の課題に中優先度の色分け（黄）が適用される
  it("should apply yellow priority color to issues with impact scores 50-99", async () => {
    // Arrange: Setup test data with issues in the 50-99 impact score range
    const userId = "manager-001";
    const teamId = "team-alpha";
    const reportDate = "2025-01-15";

    const input: ExtractDashboardReportDataInput = {
      userId,
      teamId,
      reportDate,
      includeUnsubmitted: true,
    };

    // Act: Call the function to extract dashboard report data
    const result: DashboardReportDataOutput = await extractDashboardReportData(
      input
    );

    // Assert: Verify that issues with impact scores between 50-99 have yellow color
    const mediumPriorityIssues = result.prioritizedIssues.filter(
      (issue) => issue.priorityScore >= 50 && issue.priorityScore <= 99
    );

    // All medium-priority issues should have yellow color
    mediumPriorityIssues.forEach((issue) => {
      expect(issue.priorityColor).toBe("yellow");
    });

    // Verify structure of returned data
    expect(result).toHaveProperty("reportDate");
    expect(result).toHaveProperty("submissionSummary");
    expect(result).toHaveProperty("prioritizedIssues");
    expect(result).toHaveProperty("unsubmittedMembers");
    expect(result).toHaveProperty("lastUpdatedAt");

    // Verify submission summary structure
    expect(result.submissionSummary).toHaveProperty("totalMembers");
    expect(result.submissionSummary).toHaveProperty("submittedCount");
    expect(result.submissionSummary).toHaveProperty("unsubmittedCount");
    expect(result.submissionSummary).toHaveProperty("submissionRate");

    // Verify prioritized issues structure
    result.prioritizedIssues.forEach((issue) => {
      expect(issue).toHaveProperty("issueId");
      expect(issue).toHaveProperty("issueContent");
      expect(issue).toHaveProperty("priorityScore");
      expect(issue).toHaveProperty("priorityColor");
      expect(issue).toHaveProperty("impactLevel");
      expect(issue).toHaveProperty("reporterName");
    });

    // Verify that priority colors follow the expected distribution
    const lowPriorityIssues = result.prioritizedIssues.filter(
      (issue) => issue.priorityScore >= 0 && issue.priorityScore < 50
    );
    const highPriorityIssues = result.prioritizedIssues.filter(
      (issue) => issue.priorityScore > 99
    );

    // Low priority issues should be green
    lowPriorityIssues.forEach((issue) => {
      expect(issue.priorityColor).toBe("green");
    });

    // High priority issues should be red
    highPriorityIssues.forEach((issue) => {
      expect(issue.priorityColor).toBe("red");
    });

    // Verify date format in response
    expect(result.reportDate).toBe(reportDate);
    expect(result.lastUpdatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Verify submission rate is a valid integer between 0-100
    expect(result.submissionSummary.submissionRate).toBeGreaterThanOrEqual(0);
    expect(result.submissionSummary.submissionRate).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.submissionSummary.submissionRate)).toBe(
      true
    );
  });
});