import { generateWeeklyAnalysisReport } from "../../src/logic/analysis-reporting";
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from "../../src/agents/tx-7-imp-1/prompts/action-04";

describe("Analysis Reporting - Monthly Report Generation", () => {
  test("SCEN-128: should execute time-series issue analysis action during automated monthly report generation", async () => {
    // Setup: Create mock accumulated report data for 30 days from 10 team members
    const teamMembers = Array.from({ length: 10 }, (_, i) => ({
      memberId: `member_${String(i + 1).padStart(2, "0")}`,
      memberName: `Engineer ${i + 1}`,
    }));

    const reportStartDate = new Date("2024-01-01T00:00:00Z");
    const reportEndDate = new Date("2024-01-31T23:59:59Z");

    // Generate 30 days of reports, 3 items per day per member
    const accumulatedReportData = [];
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const reportDate = new Date(reportStartDate);
      reportDate.setDate(reportDate.getDate() + dayOffset);

      teamMembers.forEach((member) => {
        // Yesterday's accomplishment
        accumulatedReportData.push({
          reportId: `report_${member.memberId}_${dayOffset}_01`,
          memberId: member.memberId,
          memberName: member.memberName,
          reportDate: reportDate.toISOString(),
          reportType: "yesterday_accomplishment",
          content: `Completed feature development for user authentication`,
          submittedAt: reportDate.toISOString(),
        });

        // Today's plan
        accumulatedReportData.push({
          reportId: `report_${member.memberId}_${dayOffset}_02`,
          memberId: member.memberId,
          memberName: member.memberName,
          reportDate: reportDate.toISOString(),
          reportType: "today_plan",
          content: `Will implement database optimization and unit testing`,
          submittedAt: reportDate.toISOString(),
        });

        // Issue/Challenge
        const issueNumber = (dayOffset % 5) + 1;
        accumulatedReportData.push({
          reportId: `report_${member.memberId}_${dayOffset}_03`,
          memberId: member.memberId,
          memberName: member.memberName,
          reportDate: reportDate.toISOString(),
          reportType: "issue",
          content: `Issue ${issueNumber}: Database query performance degradation detected in production`,
          issueCategory: issueNumber % 2 === 0 ? "performance" : "quality",
          issuePriority: issueNumber <= 2 ? "high" : issueNumber <= 4 ? "medium" : "low",
          submittedAt: reportDate.toISOString(),
        });
      });
    }

    // Mock AI client to capture Action 4 prompt invocation
    let action04PromptCalled = false;
    let capturedAction04Data = null;

    const mockAiClient = {
      analyzeTimeSeriesTrend: async (analysisData) => {
        action04PromptCalled = true;
        capturedAction04Data = analysisData;

        // Return time-series analysis result matching expected structure
        return {
          analysisDate: "2024-01-31T23:59:59Z",
          trendPeriod: "2024-01-01〜2024-01-31",
          timeSeriesData: [
            {
              week: 1,
              issueCount: 15,
              categories: {
                performance: 10,
                quality: 5,
              },
            },
            {
              week: 2,
              issueCount: 18,
              categories: {
                performance: 11,
                quality: 7,
              },
            },
            {
              week: 3,
              issueCount: 12,
              categories: {
                performance: 8,
                quality: 4,
              },
            },
            {
              week: 4,
              issueCount: 14,
              categories: {
                performance: 9,
                quality: 5,
              },
            },
          ],
          newIssuesDetected: false,
          analysisVersion: ACTION_04_PROMPT_VERSION,
        };
      },
    };

    // Create monthly report generation trigger for first day of month
    const monthlyReportTrigger = {
      triggerId: "trigger_monthly_2024_01",
      triggerDate: "2024-01-01T00:00:00Z",
      triggerType: "monthly_report_generation",
      reportPeriod: {
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z",
      },
    };

    // Invoke the logic function with mock data
    const analysisResult = await generateWeeklyAnalysisReport({
      trigger: monthlyReportTrigger,
      accumulatedReports: accumulatedReportData,
      aiClient: mockAiClient,
      reportMetadata: {
        totalMembers: 10,
        totalReportDays: 30,
        reportsPerDay: 3,
      },
    });

    // Verify Action 4 prompt was invoked
    expect(action04PromptCalled).toBe(true);

    // Verify the data passed to Action 4 contains complete report dataset
    expect(capturedAction04Data).not.toBeNull();
    expect(capturedAction04Data.reportCount).toBe(900); // 10 members × 30 days × 3 reports
    expect(capturedAction04Data.memberCount).toBe(10);
    expect(capturedAction04Data.dayCount).toBe(30);

    // Verify analysis result structure
    expect(analysisResult).toHaveProperty("analysisDate");
    expect(analysisResult).toHaveProperty("trendPeriod");
    expect(analysisResult).toHaveProperty("timeSeriesData");
    expect(analysisResult).toHaveProperty("newIssuesDetected");
    expect(analysisResult).toHaveProperty("analysisVersion");

    // Verify time-series data structure
    expect(Array.isArray(analysisResult.timeSeriesData)).toBe(true);
    expect(analysisResult.timeSeriesData.length).toBe(4); // 4 weeks

    // Verify week 1 data
    expect(analysisResult.timeSeriesData[0]).toEqual({
      week: 1,
      issueCount: 15,
      categories: {
        performance: 10,
        quality: 5,
      },
    });

    // Verify analysis version matches Action 04 prompt version
    expect(analysisResult.analysisVersion).toBe(ACTION_04_PROMPT_VERSION);

    // Verify analysis date is in correct ISO format
    expect(analysisResult.analysisDate).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Verify trend period captures full month range
    expect(analysisResult.trendPeriod).toBe("2024-01-01〜2024-01-31");

    // Verify new issues detection flag
    expect(typeof analysisResult.newIssuesDetected).toBe("boolean");
    expect(analysisResult.newIssuesDetected).toBe(false);

    // Verify result structure has no unexpected fields
    const expectedKeys = new Set([
      "analysisDate",
      "trendPeriod",
      "timeSeriesData",
      "newIssuesDetected",
      "analysisVersion",
    ]);
    const resultKeys = new Set(Object.keys(analysisResult));
    expect(resultKeys).toEqual(expectedKeys);

    // Verify Action 4 prompt module exports
    expect(typeof buildAction04Prompt).toBe("function");
    expect(typeof ACTION_04_PROMPT_VERSION).toBe("string");
    expect(ACTION_04_PROMPT_VERSION.length).toBeGreaterThan(0);
  });
});