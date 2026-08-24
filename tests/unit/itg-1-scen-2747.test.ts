import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractDashboardReportData } from "../../src/logic/manager-dashboard";
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
} from "../../src/logic/manager-dashboard";

describe("ダッシュボード表示機能 - 課題優先度順序付け", () => {
  // SCEN-2747
  test("報告が0件の場合に空の課題一覧が返却される", () => {
    const input: ExtractDashboardReportDataInput = {
      userId: "user-001",
      teamId: "team-001",
      reportDate: "2024-01-15",
      includeUnsubmitted: true,
    };

    const result: DashboardReportDataOutput = extractDashboardReportData(input);

    expect(result.reportDate).toBe("2024-01-15");
    expect(result.submissionSummary.totalMembers).toBe(0);
    expect(result.submissionSummary.submittedCount).toBe(0);
    expect(result.submissionSummary.unsubmittedCount).toBe(0);
    expect(result.submissionSummary.submissionRate).toBe(0);
    expect(result.prioritizedIssues).toEqual([]);
    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.lastUpdatedAt).toBeDefined();
  });
});