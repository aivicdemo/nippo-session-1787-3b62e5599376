import { describe, test, expect } from "@jest/globals";
import { generateMonthlyAnalysisReport } from "../../src/logic/monthly-analysis-report";

describe("Monthly Analysis Report Generation", () => {
  test("SCEN-460: Generate monthly analysis report with project delay risk calculation based on design formula", () => {
    // Prepare test data for monthly report analysis
    const targetMonth = "2024-01";
    const teamCapacity = 40; // person-days capacity
    const currentDateTime = new Date("2024-01-15T10:00:00Z");
    const projectDeadline = new Date("2024-02-14T17:00:00Z"); // 30 days from current
    const reportDeadlineTime = "09:00";

    // Setup monthly report data with issues
    const monthlyReportData = {
      issues: [
        {
          keyword: "ビルド失敗",
          frequency: 8,
          impactScore: 75,
        },
        {
          keyword: "テスト環境不安定",
          frequency: 5,
          impactScore: 60,
        },
        {
          keyword: "リソース不足",
          frequency: 3,
          impactScore: 50,
        },
        {
          keyword: "依存関係エラー",
          frequency: 2,
          impactScore: 45,
        },
      ],
    };

    // Setup risk threshold criteria
    const riskThresholds = {
      high: 80,
      medium: 50,
    };

    // Manual calculation based on br-tx_7-008 formula
    // Step 1: Calculate issue weight = frequency × impactScore
    const issueWeights = monthlyReportData.issues.map((issue) => issue.frequency * issue.impactScore);
    // [600, 300, 150, 90]

    // Step 2: Estimate required days (assuming 0.5 days per unit weight)
    const estimatedResolutionDaysPerUnit = 0.5;
    const totalRequiredDays = issueWeights.reduce((sum, weight) => sum + weight * estimatedResolutionDaysPerUnit, 0);
    // (600 + 300 + 150 + 90) * 0.5 = 570

    // Step 3: Available capacity days = teamCapacity / 8
    const availableCapacityDays = teamCapacity / 8;
    // 40 / 8 = 5

    // Step 4: Calculate risk score = min(100, (totalRequiredDays / availableCapacityDays) * 100)
    const expectedRiskScore = Math.min(100, (totalRequiredDays / availableCapacityDays) * 100);
    // min(100, (570 / 5) * 100) = min(100, 11400) = 100

    // Step 5: Determine risk level
    let expectedRiskLevel: "high" | "medium" | "low";
    if (expectedRiskScore >= riskThresholds.high) {
      expectedRiskLevel = "high";
    } else if (expectedRiskScore >= riskThresholds.medium) {
      expectedRiskLevel = "medium";
    } else {
      expectedRiskLevel = "low";
    }
    // expectedRiskLevel = "high"

    // Step 6: Sort issues by importance (frequency × impactScore) in descending order
    const sortedIssuesWithWeight = monthlyReportData.issues
      .map((issue) => ({
        ...issue,
        weight: issue.frequency * issue.impactScore,
      }))
      .sort((a, b) => b.weight - a.weight);

    const expectedCriticalIssues = sortedIssuesWithWeight.slice(0, 3);
    // [ビルド失敗 (600), テスト環境不安定 (300), リソース不足 (150)]

    // Step 7: Calculate recommended action deadline (30% buffer)
    const daysUntilDeadline = Math.floor((projectDeadline.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60 * 24));
    // 30 days
    const recommendedActionDeadlineMs = projectDeadline.getTime() - (daysUntilDeadline * 0.3 * 24 * 60 * 60 * 1000);
    const expectedRecommendedActionDeadline = new Date(recommendedActionDeadlineMs);

    // Execute function under test
    const result = generateMonthlyAnalysisReport({
      targetMonth,
      monthlyReportData,
      teamCapacity,
      projectDeadline,
      currentDateTime,
      riskThresholds,
    });

    // Verify risk score matches calculated value
    expect(result.riskScore).toBe(expectedRiskScore);

    // Verify risk level is correctly determined
    expect(result.riskLevel).toBe(expectedRiskLevel);

    // Verify critical issues are top 3 sorted by weight in descending order
    expect(result.criticalIssues).toHaveLength(3);
    expect(result.criticalIssues[0].keyword).toBe("ビルド失敗");
    expect(result.criticalIssues[0].frequency).toBe(8);
    expect(result.criticalIssues[0].impactScore).toBe(75);
    expect(result.criticalIssues[1].keyword).toBe("テスト環境不安定");
    expect(result.criticalIssues[1].frequency).toBe(5);
    expect(result.criticalIssues[1].impactScore).toBe(60);
    expect(result.criticalIssues[2].keyword).toBe("リソース不足");
    expect(result.criticalIssues[2].frequency).toBe(3);
    expect(result.criticalIssues[2].impactScore).toBe(50);

    // Verify days until deadline
    expect(result.daysUntilDeadline).toBe(daysUntilDeadline);

    // Verify recommended action deadline is calculated with 30% buffer
    expect(result.recommendedActionDeadline).toEqual(expectedRecommendedActionDeadline);
  });
});