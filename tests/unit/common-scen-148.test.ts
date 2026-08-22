import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { generateWeeklyAnalysisReport } from "../../src/logic/analysis-reporting";

describe("analysis-reporting: generateWeeklyAnalysisReport", () => {
  // SCEN-148: [normal] 課題検索から可視化レポート作成までの自動実行 AIエージェント
  test("should execute autonomous highlight of high-priority issues with recurrence-sorted output and audit event", async () => {
    const mockIssueDataset = [
      {
        issueId: "ISSUE-001",
        priority: "HIGH",
        recurrenceCount: 5,
        lastOccurrenceDatetime: "2024-01-14T09:30:00Z",
        pattern: "Database connection timeout",
      },
      {
        issueId: "ISSUE-002",
        priority: "HIGH",
        recurrenceCount: 3,
        lastOccurrenceDatetime: "2024-01-13T14:15:00Z",
        pattern: "API rate limit exceeded",
      },
      {
        issueId: "ISSUE-003",
        priority: "HIGH",
        recurrenceCount: 7,
        lastOccurrenceDatetime: "2024-01-12T11:00:00Z",
        pattern: "Memory leak in service",
      },
      {
        issueId: "ISSUE-004",
        priority: "MEDIUM",
        recurrenceCount: 2,
        lastOccurrenceDatetime: "2024-01-11T16:45:00Z",
        pattern: "Slow query performance",
      },
      {
        issueId: "ISSUE-005",
        priority: "MEDIUM",
        recurrenceCount: 1,
        lastOccurrenceDatetime: "2024-01-10T13:20:00Z",
        pattern: "Cache invalidation issue",
      },
      {
        issueId: "ISSUE-006",
        priority: "LOW",
        recurrenceCount: 1,
        lastOccurrenceDatetime: "2024-01-09T10:00:00Z",
        pattern: "Documentation typo",
      },
      {
        issueId: "ISSUE-007",
        priority: "HIGH",
        recurrenceCount: 4,
        lastOccurrenceDatetime: "2024-01-08T15:30:00Z",
        pattern: "Deployment script failure",
      },
      {
        issueId: "ISSUE-008",
        priority: "LOW",
        recurrenceCount: 2,
        lastOccurrenceDatetime: "2024-01-07T12:00:00Z",
        pattern: "UI rendering glitch",
      },
      {
        issueId: "ISSUE-009",
        priority: "MEDIUM",
        recurrenceCount: 3,
        lastOccurrenceDatetime: "2024-01-06T09:45:00Z",
        pattern: "Email notification delay",
      },
      {
        issueId: "ISSUE-010",
        priority: "HIGH",
        recurrenceCount: 6,
        lastOccurrenceDatetime: "2024-01-05T14:00:00Z",
        pattern: "Transaction rollback unexpectedly",
      },
      {
        issueId: "ISSUE-011",
        priority: "LOW",
        recurrenceCount: 1,
        lastOccurrenceDatetime: "2024-01-04T11:15:00Z",
        pattern: "Logging format inconsistency",
      },
    ];

    const mockTimelineData = [
      {
        patternId: "PATTERN-001",
        pattern: "Database connection timeout",
        occurrenceCount: 5,
        timeline: ["2024-01-14", "2024-01-13", "2024-01-12", "2024-01-11", "2024-01-10"],
      },
      {
        patternId: "PATTERN-002",
        pattern: "API rate limit exceeded",
        occurrenceCount: 3,
        timeline: ["2024-01-13", "2024-01-12", "2024-01-11"],
      },
      {
        patternId: "PATTERN-003",
        pattern: "Memory leak in service",
        occurrenceCount: 7,
        timeline: ["2024-01-14", "2024-01-13", "2024-01-12", "2024-01-11", "2024-01-10", "2024-01-09", "2024-01-08"],
      },
      {
        patternId: "PATTERN-004",
        pattern: "Deployment script failure",
        occurrenceCount: 4,
        timeline: ["2024-01-08", "2024-01-07", "2024-01-06", "2024-01-05"],
      },
      {
        patternId: "PATTERN-005",
        pattern: "Transaction rollback unexpectedly",
        occurrenceCount: 6,
        timeline: ["2024-01-14", "2024-01-12", "2024-01-10", "2024-01-08", "2024-01-06", "2024-01-04"],
      },
    ];

    const mockBottleneckChanges = [
      {
        pattern: "Database connection timeout",
        severity: "CRITICAL",
        changePercent: 25,
      },
      {
        pattern: "Memory leak in service",
        severity: "CRITICAL",
        changePercent: 40,
      },
      {
        pattern: "Deployment script failure",
        severity: "HIGH",
        changePercent: 15,
      },
      {
        pattern: "Transaction rollback unexpectedly",
        severity: "HIGH",
        changePercent: 20,
      },
    ];

    const mockReportMetadata = {
      generatedAt: "2024-01-15T09:00:00Z",
      dataRange: {
        startDate: "2024-01-08T00:00:00Z",
        endDate: "2024-01-14T23:59:59Z",
      },
      analyzedCount: 11,
    };

    const mockAuditEvents: Array<{
      action: string;
      status: string;
      executedAt: string;
    }> = [];

    const mockGenerateAuditEvent = jest.fn((action: string, status: string) => {
      mockAuditEvents.push({
        action,
        status,
        executedAt: "2024-01-15T09:00:00Z",
      });
    });

    const result = await generateWeeklyAnalysisReport(
      {
        issues: mockIssueDataset,
        timelineAnalysis: mockTimelineData,
        bottleneckChanges: mockBottleneckChanges,
        reportMetadata: mockReportMetadata,
        generateAuditEvent: mockGenerateAuditEvent,
      }
    );

    // Verify extraction count >= 10
    expect(result.extractedIssueCount).toBeGreaterThanOrEqual(10);

    // Verify timeline analysis contains required fields
    expect(result.timelineAnalysis).toBeDefined();
    expect(result.timelineAnalysis.length).toBeGreaterThan(0);
    result.timelineAnalysis.forEach((item) => {
      expect(item).toHaveProperty("patternId");
      expect(item).toHaveProperty("occurrenceCount");
      expect(item).toHaveProperty("timeline");
    });

    // Verify bottleneck changes contain required fields
    expect(result.bottleneckChanges).toBeDefined();
    expect(result.bottleneckChanges.length).toBeGreaterThan(0);
    result.bottleneckChanges.forEach((item) => {
      expect(item).toHaveProperty("pattern");
      expect(item).toHaveProperty("severity");
      expect(item).toHaveProperty("changePercent");
    });

    // Verify report metadata fields
    expect(result.reportMetadata).toBeDefined();
    expect(result.reportMetadata).toHaveProperty("generatedAt");
    expect(result.reportMetadata).toHaveProperty("dataRange");
    expect(result.reportMetadata).toHaveProperty("analyzedCount");

    // Verify highlighted issues exist and contain minimum 3 HIGH priority items
    expect(result.highlightedIssues).toBeDefined();
    expect(Array.isArray(result.highlightedIssues)).toBe(true);
    expect(result.highlightedIssues.length).toBeGreaterThanOrEqual(3);

    const highPriorityIssues = result.highlightedIssues.filter(
      (issue) => issue.priority === "HIGH"
    );
    expect(highPriorityIssues.length).toBeGreaterThanOrEqual(3);

    // Verify each highlighted issue has required fields
    result.highlightedIssues.forEach((issue) => {
      expect(issue).toHaveProperty("issueId");
      expect(issue).toHaveProperty("priority");
      expect(issue).toHaveProperty("recurrenceCount");
      expect(issue).toHaveProperty("lastOccurrenceDatetime");
      expect(issue).toHaveProperty("highlightReason");
    });

    // Verify highlighted issues are sorted by recurrenceCount descending
    for (let i = 0; i < result.highlightedIssues.length - 1; i++) {
      expect(result.highlightedIssues[i].recurrenceCount).toBeGreaterThanOrEqual(
        result.highlightedIssues[i + 1].recurrenceCount
      );
    }

    // Verify audit event was generated with correct action and status
    expect(mockGenerateAuditEvent).toHaveBeenCalled();
    const auditEventCall = mockAuditEvents.find(
      (evt) => evt.action === "HIGHLIGHT_HIGH_PRIORITY_ISSUES"
    );
    expect(auditEventCall).toBeDefined();
    expect(auditEventCall?.status).toBe("SUCCESS");
    expect(auditEventCall?.executedAt).toBe("2024-01-15T09:00:00Z");

    // Verify specific highlighted issues have expected properties
    const issue001 = result.highlightedIssues.find(
      (issue) => issue.issueId === "ISSUE-001"
    );
    expect(issue001).toBeDefined();
    expect(issue001?.priority).toBe("HIGH");
    expect(issue001?.recurrenceCount).toBe(5);

    const issue003 = result.highlightedIssues.find(
      (issue) => issue.issueId === "ISSUE-003"
    );
    expect(issue003).toBeDefined();
    expect(issue003?.recurrenceCount).toBe(7);

    const issue010 = result.highlightedIssues.find(
      (issue) => issue.issueId === "ISSUE-010"
    );
    expect(issue010).toBeDefined();
    expect(issue010?.recurrenceCount).toBe(6);

    // Verify order: ISSUE-003 (7) > ISSUE-010 (6) > ISSUE-001 (5) > ISSUE-007 (4) > ISSUE-002 (3)
    const highPriorityIssuesSorted = result.highlightedIssues.filter(
      (issue) => issue.priority === "HIGH"
    );
    const recurrenceCounts = highPriorityIssuesSorted.map(
      (issue) => issue.recurrenceCount
    );
    expect(recurrenceCounts).toEqual([7, 6, 5, 4, 3]);
  });
});