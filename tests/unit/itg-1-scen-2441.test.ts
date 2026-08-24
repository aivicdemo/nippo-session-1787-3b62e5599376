import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateMonthlyReportApproval } from "../../src/logic/monthly-performance-analysis";

describe("課題の影響度判定と優先度スコア表示", () => {
  // SCEN-2441
  test("分析結果監査ログ記録機能 - 判定に用いたデータ範囲（開始日）が空文字列のとき、監査ログ記録が失敗する", () => {
    const reportId = "report-2024-01-001";
    const approvalStatus = "approved";
    const approverUserId = "user-dept-manager-001";

    const invalidAuditLogInput = {
      reportId,
      approvalStatus,
      rejectionReason: undefined,
      approverUserId,
      analysisDataRange: {
        startDate: "",
        endDate: "2024-01-31T23:59:59Z",
      },
      decisionRationale: "課題優先度判定ルール v2.1 適用",
      priorityJudgmentLogicVersion: "v2.1",
    };

    expect(() => validateMonthlyReportApproval(invalidAuditLogInput)).toThrow(
      /開始日/
    );
  });
});