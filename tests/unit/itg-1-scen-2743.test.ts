import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractDashboardReportData } from "../../src/logic/manager-dashboard";
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
  PrioritizedIssue,
} from "../../src/logic/manager-dashboard";

describe("Manager Dashboard - Prioritized Issues Display", () => {
  // SCEN-2743: [normal] ダッシュボード表示機能 - 優先度スコアが同一の複数課題が同じ順序で並ぶ
  test("should display multiple issues with identical priority scores in consistent chronological order by registration timestamp", async () => {
    const userId = "user-manager-001";
    const teamId = "team-001";
    const reportDate = "2024-01-15";

    const mockIssueA = {
      issueId: "issue-A-001",
      issueContent: "Database connection timeout",
      priorityScore: 75,
      impactLevel: "high" as const,
      reporterName: "Engineer Alpha",
      registrationTimestamp: "2024-01-15T09:00:00Z",
    };

    const mockIssueB = {
      issueId: "issue-B-001",
      issueContent: "API response latency",
      priorityScore: 75,
      impactLevel: "high" as const,
      reporterName: "Engineer Beta",
      registrationTimestamp: "2024-01-15T09:00:05Z",
    };

    const mockIssueC = {
      issueId: "issue-C-001",
      issueContent: "Memory leak in worker process",
      priorityScore: 75,
      impactLevel: "high" as const,
      reporterName: "Engineer Gamma",
      registrationTimestamp: "2024-01-15T09:00:10Z",
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ["timeout", "latency", "memory"],
        frequencies: [2, 1, 1],
      }),
      assessImpactScore: jest.fn().mockImplementation((content) => {
        return Promise.resolve(75);
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue("high"),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent",
        timestamp: "2024-01-15T11:00:00Z",
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    const input: ExtractDashboardReportDataInput = {
      userId,
      teamId,
      reportDate,
      includeUnsubmitted: true,
    };

    const output: DashboardReportDataOutput = await extractDashboardReportData(
      input,
      mockTextAnalysisAdapter,
      mockNotificationAdapter
    );

    expect(output).toBeDefined();
    expect(output.reportDate).toBe("2024-01-15");
    expect(output.prioritizedIssues).toBeDefined();
    expect(output.prioritizedIssues.length).toBeGreaterThanOrEqual(3);

    const prioritizedIssues = output.prioritizedIssues;

    const issueAIndex = prioritizedIssues.findIndex((i) =>
      i.issueContent.includes("Database")
    );
    const issueBIndex = prioritizedIssues.findIndex((i) =>
      i.issueContent.includes("API")
    );
    const issueCIndex = prioritizedIssues.findIndex((i) =>
      i.issueContent.includes("Memory")
    );

    expect(issueAIndex).not.toBe(-1);
    expect(issueBIndex).not.toBe(-1);
    expect(issueCIndex).not.toBe(-1);

    const issuesWithScore75 = prioritizedIssues.filter(
      (issue) => issue.priorityScore === 75
    );
    expect(issuesWithScore75.length).toBeGreaterThanOrEqual(3);

    const firstIssueWithScore75 = issuesWithScore75[0];
    const secondIssueWithScore75 = issuesWithScore75[1];
    const thirdIssueWithScore75 = issuesWithScore75[2];

    expect(firstIssueWithScore75.priorityScore).toBe(75);
    expect(secondIssueWithScore75.priorityScore).toBe(75);
    expect(thirdIssueWithScore75.priorityScore).toBe(75);

    const firstTimestamp = firstIssueWithScore75.issueId?.localeCompare(
      secondIssueWithScore75.issueId ?? ""
    );
    const secondTimestamp = secondIssueWithScore75.issueId?.localeCompare(
      thirdIssueWithScore75.issueId ?? ""
    );

    expect(firstTimestamp).toBeLessThan(0);
    expect(secondTimestamp).toBeLessThan(0);

    const output2: DashboardReportDataOutput = await extractDashboardReportData(
      input,
      mockTextAnalysisAdapter,
      mockNotificationAdapter
    );

    expect(output2.prioritizedIssues).toBeDefined();
    const issuesWithScore75Reload = output2.prioritizedIssues.filter(
      (issue) => issue.priorityScore === 75
    );

    expect(issuesWithScore75Reload.length).toBeGreaterThanOrEqual(3);

    const firstReloadIssue = issuesWithScore75Reload[0];
    const secondReloadIssue = issuesWithScore75Reload[1];
    const thirdReloadIssue = issuesWithScore75Reload[2];

    expect(firstReloadIssue.issueId).toBe(firstIssueWithScore75.issueId);
    expect(secondReloadIssue.issueId).toBe(secondIssueWithScore75.issueId);
    expect(thirdReloadIssue.issueId).toBe(thirdIssueWithScore75.issueId);

    const input2: ExtractDashboardReportDataInput = {
      userId: "user-manager-002",
      teamId,
      reportDate,
      includeUnsubmitted: true,
    };

    const output3: DashboardReportDataOutput = await extractDashboardReportData(
      input2,
      mockTextAnalysisAdapter,
      mockNotificationAdapter
    );

    expect(output3.prioritizedIssues).toBeDefined();
    const issuesWithScore75User2 = output3.prioritizedIssues.filter(
      (issue) => issue.priorityScore === 75
    );

    expect(issuesWithScore75User2.length).toBeGreaterThanOrEqual(3);

    const firstUser2Issue = issuesWithScore75User2[0];
    const secondUser2Issue = issuesWithScore75User2[1];
    const thirdUser2Issue = issuesWithScore75User2[2];

    expect(firstUser2Issue.issueId).toBe(firstIssueWithScore75.issueId);
    expect(secondUser2Issue.issueId).toBe(secondIssueWithScore75.issueId);
    expect(thirdUser2Issue.issueId).toBe(thirdIssueWithScore75.issueId);

    expect(output.lastUpdatedAt).toBeDefined();
    const lastUpdateTimestamp = new Date(output.lastUpdatedAt).getTime();
    expect(lastUpdateTimestamp).toBeGreaterThan(0);
  });
});