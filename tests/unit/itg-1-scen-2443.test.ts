import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateMonthlyReportApproval } from "../../src/logic/monthly-performance-analysis";
import type { MonthlyReportApprovalInput } from "../../src/logic/monthly-performance-analysis";

describe("課題の影響度判定と優先度スコア表示機能", () => {
  // SCEN-2443: [error] 分析結果監査ログ記録機能 - 判定に用いたデータ範囲（終了日）がnullのとき、監査ログ記録が失敗する
  test("終了日がnullのデータ範囲で監査ログ記録を試みると INVALID_DATA_RANGE エラーをスロー", () => {
    const invalidApprovalInput: MonthlyReportApprovalInput = {
      reportId: "monthly-report-2026-01",
      approvalStatus: "approved",
      approverUserId: "user-director-001",
    };

    const mockAnalysisDataRange = {
      startDate: "2026-01-01",
      endDate: null,
    };

    const mockAuditLogRecord = {
      analysisConfirmedAt: new Date("2026-01-31T18:00:00Z"),
      executorUserId: "user-pm-001",
      dataRangeStart: mockAnalysisDataRange.startDate,
      dataRangeEnd: mockAnalysisDataRange.endDate,
      priorityJudgmentLogicVersion: "v2.1.0",
      previousChangeDetail: "Updated threshold from 65 to 70",
    };

    expect(() => {
      validateMonthlyReportApproval(invalidApprovalInput, mockAuditLogRecord);
    }).toThrow(/データ範囲の終了日がnull/);
  });
});