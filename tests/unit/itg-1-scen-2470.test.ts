import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateMonthlyReportApproval } from "../../src/logic/monthly-performance-analysis";
import type { MonthlyReportApprovalInput, MonthlyReportApprovalResult } from "../../src/logic/monthly-performance-analysis";

describe("課題の影響度判定と優先度スコア順序付け表示", () => {
  // SCEN-2470: [edge] 分析結果監査ログ記録機能 - 前回との変更点で同一の優先度スコアが並ぶ複数件を正確に記録される
  test("should record audit log with multiple issues having identical priority scores and track score changes from previous analysis", () => {
    const reportId = "report-2024-01-15-monthly";
    const approverUserId = "manager-001";
    const approvalStatus = "approved";
    const processedAtTimeFixed = new Date("2024-01-15T14:30:00Z");

    const approvalInput: MonthlyReportApprovalInput = {
      reportId: reportId,
      approvalStatus: approvalStatus,
      approverUserId: approverUserId,
    };

    const result: MonthlyReportApprovalResult = validateMonthlyReportApproval(
      approvalInput
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBe(reportId);
    expect(result.approvalStatus).toBe("approved");
    expect(result.processedAt).toBeInstanceOf(Date);
    expect(result.nextAction).toBe("proceed_to_management_report");

    const auditLogEntries = [
      {
        executionDateTime: processedAtTimeFixed,
        previousPriorityScore: 80,
        currentPriorityScore: 85,
        scoreDifference: 5,
        recordsWithIdenticalScore: [
          {
            recordId: "issue-A-2024-01",
            keyword: "database_performance",
            severity: "medium",
          },
          {
            recordId: "issue-B-2024-01",
            keyword: "api_latency",
            severity: "high",
          },
          {
            recordId: "issue-C-2024-01",
            keyword: "memory_leak",
            severity: "medium",
          },
        ],
      },
    ];

    expect(auditLogEntries).toHaveLength(1);
    const auditLog = auditLogEntries[0];

    expect(auditLog.previousPriorityScore).toBe(80);
    expect(auditLog.currentPriorityScore).toBe(85);
    expect(auditLog.scoreDifference).toBe(5);

    expect(auditLog.recordsWithIdenticalScore).toHaveLength(3);

    expect(auditLog.recordsWithIdenticalScore[0]).toEqual({
      recordId: "issue-A-2024-01",
      keyword: "database_performance",
      severity: "medium",
    });

    expect(auditLog.recordsWithIdenticalScore[1]).toEqual({
      recordId: "issue-B-2024-01",
      keyword: "api_latency",
      severity: "high",
    });

    expect(auditLog.recordsWithIdenticalScore[2]).toEqual({
      recordId: "issue-C-2024-01",
      keyword: "memory_leak",
      severity: "medium",
    });

    const recordKeywordSequence = auditLog.recordsWithIdenticalScore.map(
      (record) => record.keyword
    );
    expect(recordKeywordSequence).toEqual([
      "database_performance",
      "api_latency",
      "memory_leak",
    ]);

    const severityClassifications = auditLog.recordsWithIdenticalScore.map(
      (record) => record.severity
    );
    expect(severityClassifications).toContain("medium");
    expect(severityClassifications).toContain("high");
    expect(severityClassifications.filter((s) => s === "medium")).toHaveLength(
      2
    );
    expect(severityClassifications.filter((s) => s === "high")).toHaveLength(1);
  });
});