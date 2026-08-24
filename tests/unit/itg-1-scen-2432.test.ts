import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateMonthlyReportApproval } from "../../src/logic/monthly-performance-analysis";
import type {
  MonthlyReportApprovalInput,
  MonthlyReportApprovalResult,
} from "../../src/logic/monthly-performance-analysis";

describe("課題の影響度判定と優先度スコア表示機能", () => {
  // SCEN-2432: [normal] 分析結果確定監査ログ記録機能
  test("プロジェクトマネージャーが確定操作を実行した場合、実行者情報がAuditLogテーブルに記録される", () => {
    const input: MonthlyReportApprovalInput = {
      reportId: "report-2024-01-001",
      approvalStatus: "approved",
      approverUserId: "PM001",
    };

    const expectedExecutedUserId = "PM001";
    const expectedExecutedUserName = "山田太郎";
    const expectedAction = "ANALYSIS_RESULT_CONFIRMED";

    const executeTimestamp = new Date("2024-01-15T11:00:00Z");

    const result: MonthlyReportApprovalResult =
      validateMonthlyReportApproval(input);

    expect(result.reportId).toBe("report-2024-01-001");
    expect(result.approvalStatus).toBe("approved");
    expect(result.nextAction).toBe("proceed_to_management_report");

    expect(result.processedAt).toEqual(executeTimestamp);

    expect(result).toHaveProperty("auditLog");
    if (result.auditLog) {
      expect(result.auditLog.executed_user_id).toBe(expectedExecutedUserId);
      expect(result.auditLog.executed_user_name).toBe(
        expectedExecutedUserName
      );
      expect(result.auditLog.action).toBe(expectedAction);
      expect(result.auditLog.timestamp).toEqual(executeTimestamp);
    }
  });
});