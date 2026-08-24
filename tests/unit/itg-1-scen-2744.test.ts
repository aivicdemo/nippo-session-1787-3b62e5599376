import { describe, test, expect } from "@jest/globals";
import { extractDashboardReportData } from "../../src/logic/manager-dashboard";
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
  PrioritizedIssue,
} from "../../src/logic/manager-dashboard";

describe("Dashboard Report Data Extraction with Priority Color Assignment", () => {
  // SCEN-2744: [normal] ダッシュボード表示機能 - 影響度スコア100の課題に最高優先度の色分け（赤）が適用される
  test("should apply red priority color to issue with impact score 100", async () => {
    // Setup: Mock TextAnalysisServiceAdapter that returns impact score 100
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ["デプロイ遅延"],
        frequency: 3,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(100),
      classifyIssueSeverity: jest.fn().mockResolvedValue("high"),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent",
        timestamp: "2024-01-15T09:00:00Z",
      }),
      scheduleNotification: jest
        .fn()
        .mockResolvedValue({ scheduledId: "sched-001" }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: "delivered" }),
    };

    // Prepare input data with a report containing issues
    const input: ExtractDashboardReportDataInput = {
      userId: "user-001",
      teamId: "team-001",
      reportDate: "2024-01-15",
      includeUnsubmitted: true,
    };

    // Mock database/system responses for reports and issues
    const mockReportData = [
      {
        reportId: "report-001",
        reporterId: "engineer-001",
        reporterName: "Engineer A",
        teamId: "team-001",
        submissionStatus: "submitted",
        submissionTimestamp: "2024-01-15T08:30:00Z",
        yesterdayAccomplishment: "Completed API integration",
        todayPlan: "Deploy to staging",
        challenges: "Deployment pipeline timeout issue",
      },
      {
        reportId: "report-002",
        reporterId: "engineer-002",
        reporterName: "Engineer B",
        teamId: "team-001",
        submissionStatus: "submitted",
        submissionTimestamp: "2024-01-15T08:45:00Z",
        yesterdayAccomplishment: "Fixed database connection",
        todayPlan: "Deploy to staging",
        challenges: "Deployment pipeline timeout issue",
      },
    ];

    const mockExtractedIssues = [
      {
        issueId: "issue-001",
        issueContent: "Deployment pipeline timeout issue",
        priorityScore: 100,
        impactScore: 100,
        frequency: 2,
        reporterIds: ["engineer-001", "engineer-002"],
      },
    ];

    // Call the function with mocked adapters
    // In a real scenario, these adapters would be injected into the function
    const result = await extractDashboardReportData(input, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
      reportDataSource: {
        getReportsByTeamAndDate: jest
          .fn()
          .mockResolvedValue(mockReportData),
        getUnsubmittedMembers: jest.fn().mockResolvedValue([]),
      },
      issueDataSource: {
        getExtractedIssuesForDate: jest
          .fn()
          .mockResolvedValue(mockExtractedIssues),
      },
    });

    // Assertions
    expect(result).toBeDefined();
    expect(result.reportDate).toBe("2024-01-15");
    expect(result.submissionSummary).toBeDefined();
    expect(result.submissionSummary.totalMembers).toBe(2);
    expect(result.submissionSummary.submittedCount).toBe(2);
    expect(result.submissionSummary.unsubmittedCount).toBe(0);
    expect(result.submissionSummary.submissionRate).toBe(100);

    // Verify prioritized issues are present and sorted correctly
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBeGreaterThan(0);

    // Find the high-impact issue
    const criticalIssue: PrioritizedIssue | undefined =
      result.prioritizedIssues.find((issue) => issue.priorityScore === 100);

    expect(criticalIssue).toBeDefined();
    expect(criticalIssue?.issueId).toBe("issue-001");
    expect(criticalIssue?.issueContent).toBe(
      "Deployment pipeline timeout issue"
    );
    expect(criticalIssue?.priorityScore).toBe(100);
    expect(criticalIssue?.impactLevel).toBe("high");

    // Verify red priority color is applied to the critical issue
    // Priority color mapping: score 100 should map to "red"
    expect(criticalIssue?.priorityColor).toBe("red");

    // Verify the issue is sorted first (highest priority)
    expect(result.prioritizedIssues[0]).toEqual(criticalIssue);

    // Verify lastUpdatedAt is set to ISO 8601 format
    expect(result.lastUpdatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});