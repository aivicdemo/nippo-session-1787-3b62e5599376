import { validateMonthlyReportApproval } from "../../src/logic/monthly-performance-analysis";
import type { MonthlyReportApprovalInput, MonthlyReportApprovalResult } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告管理システム - 対策案の承認状態判定", () => {
  // SCEN-2020
  test("開発部長による承認が完了した対策案について、承認完了状態が正しく判定される", () => {
    // Arrange: テストデータの準備
    const reportId = "report-001";
    const approverUserId = "manager-user-001";
    const approvalInput: MonthlyReportApprovalInput = {
      reportId: reportId,
      approvalStatus: "approved",
      approverUserId: approverUserId,
    };

    // Act: 承認処理を実行
    const result: MonthlyReportApprovalResult = validateMonthlyReportApproval(approvalInput);

    // Assert: 承認結果を検証
    expect(result.reportId).toBe(reportId);
    expect(result.approvalStatus).toBe("approved");
    expect(result.nextAction).toBe("proceed_to_management_report");

    // processedAt が正しく記録されていることを確認（ISO 8601形式の日時）
    expect(result.processedAt).toBeInstanceOf(Date);
    expect(result.processedAt.getTime()).toBeGreaterThan(0);

    // 承認完了時の遷移処理が正しく実行される
    expect(result.approvalStatus).toBe("approved");
  });
});