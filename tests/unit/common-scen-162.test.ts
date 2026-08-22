import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { calculateProductivityMetrics } from "../../src/logic/analysis-reporting";
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from "../../src/agents/tx-9-imp-1/prompts/action-03";
import type { Tx9Imp1AiClient } from "../../src/agents/tx-9-imp-1/orchestrator";

describe("calculateProductivityMetrics", () => {
  // SCEN-162: [normal] 生産性指標（課題件数、解決期間、対応速度）を定量化する
  test("should calculate productivity metrics with correct quantified values for aggregated daily reports", async () => {
    // Stub data: 10 members, 35 total issues, resolution period avg 3.2 days, response speed 10.9 issues/day
    const aggregatedReportData = [
      {
        memberId: "user_001",
        memberName: "田中太郎",
        reportDate: "2024-01-01",
        issueCount: 3,
        resolutionDays: 2.5,
      },
      {
        memberId: "user_002",
        memberName: "鈴木花子",
        reportDate: "2024-01-02",
        issueCount: 4,
        resolutionDays: 3.0,
      },
      {
        memberId: "user_003",
        memberName: "佐藤次郎",
        reportDate: "2024-01-03",
        issueCount: 3,
        resolutionDays: 3.5,
      },
      {
        memberId: "user_004",
        memberName: "高橋美咲",
        reportDate: "2024-01-04",
        issueCount: 4,
        resolutionDays: 3.0,
      },
      {
        memberId: "user_005",
        memberName: "渡辺健一",
        reportDate: "2024-01-05",
        issueCount: 3,
        resolutionDays: 3.2,
      },
      {
        memberId: "user_006",
        memberName: "伊藤由美",
        reportDate: "2024-01-06",
        issueCount: 4,
        resolutionDays: 3.1,
      },
      {
        memberId: "user_007",
        memberName: "中村拓也",
        reportDate: "2024-01-07",
        issueCount: 4,
        resolutionDays: 3.4,
      },
      {
        memberId: "user_008",
        memberName: "山田春菜",
        reportDate: "2024-01-08",
        issueCount: 3,
        resolutionDays: 3.2,
      },
      {
        memberId: "user_009",
        memberName: "木村翔太",
        reportDate: "2024-01-09",
        issueCount: 2,
        resolutionDays: 3.1,
      },
      {
        memberId: "user_010",
        memberName: "林由衣",
        reportDate: "2024-01-10",
        issueCount: 2,
        resolutionDays: 3.2,
      },
    ];

    const analysisDateRange = {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    };

    // Verify Action 3 prompt module exports
    expect(typeof buildAction03Prompt).toBe("function");
    expect(typeof ACTION_03_PROMPT_VERSION).toBe("string");
    expect(ACTION_03_PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);

    // Build Action 3 prompt
    const action03_prompt = buildAction03Prompt({
      aggregatedReportData,
      analysisDateRange,
    });

    expect(action03_prompt).toBeDefined();
    expect(typeof action03_prompt).toBe("string");
    expect(action03_prompt.length).toBeGreaterThan(0);

    // Create fake AI client
    const fakeAiClient: Tx9Imp1AiClient = {
      invokeAction03: jest.fn(async (prompt: string) => {
        // Verify prompt format is valid
        expect(prompt).toContain("生産性指標");

        // Return quantified metrics matching stub data
        return {
          issueCounts: 35,
          resolutionPeriodDays: 3.2,
          responseSpeedPerDay: 10.9,
          analysisTimestamp: "2024-01-31T23:59:59Z",
        };
      }),
    };

    // Execute calculateProductivityMetrics
    const result = await calculateProductivityMetrics(
      aggregatedReportData,
      analysisDateRange,
      fakeAiClient
    );

    // Verify result structure and values
    expect(result).toBeDefined();
    expect(result.issueCounts).toBe(35);
    expect(result.resolutionPeriodDays).toBe(3.2);
    expect(result.responseSpeedPerDay).toBe(10.9);

    // Verify AI client was called with correct prompt
    expect(fakeAiClient.invokeAction03).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.invokeAction03).toHaveBeenCalledWith(action03_prompt);

    // Verify metrics are reasonable given input data
    const totalIssuesFromInput = aggregatedReportData.reduce(
      (sum, report) => sum + report.issueCount,
      0
    );
    expect(result.issueCounts).toBe(totalIssuesFromInput);

    const avgResolutionFromInput =
      aggregatedReportData.reduce((sum, report) => sum + report.resolutionDays, 0) /
      aggregatedReportData.length;
    expect(result.resolutionPeriodDays).toBe(avgResolutionFromInput);

    // responseSpeedPerDay = total issues / total days in period
    const totalDaysInPeriod = 31;
    const expectedResponseSpeed = totalIssuesFromInput / totalDaysInPeriod;
    expect(Math.abs(result.responseSpeedPerDay - expectedResponseSpeed)).toBeLessThan(0.1);
  });
});