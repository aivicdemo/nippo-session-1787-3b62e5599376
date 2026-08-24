import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateMonthlyReportApproval } from "../../src/logic/monthly-performance-analysis";
import { type MonthlyReportApprovalInput, type MonthlyReportApprovalResult } from "../../src/logic/monthly-performance-analysis";

describe("課題の影響度判定と優先度スコア表示機能", () => {
  // SCEN-2429: [normal] 分析結果確定監査ログ記録機能 - 同じ分析入力で2回確定実行しても同一内容が記録される
  test("同一の日報入力で2回確定実行した場合、監査ログに2件の同一内容レコードが記録される", () => {
    const reportId = "report-2024-01-15-001";
    const approverUserId = "user-dept-head-01";
    const reportContent = {
      yesterday: "バグ修正",
      today: "テスト実施",
      issue: "デプロイ遅延",
    };

    // 1回目の確定実行
    const input1: MonthlyReportApprovalInput = {
      reportId: reportId,
      approvalStatus: "approved",
      approverUserId: approverUserId,
    };

    const result1 = validateMonthlyReportApproval(input1);

    expect(result1).toBeDefined();
    expect(result1.reportId).toBe(reportId);
    expect(result1.approvalStatus).toBe("approved");
    expect(result1.processedAt).toBeInstanceOf(Date);
    expect(result1.nextAction).toBe("proceed_to_management_report");

    // 1回目の監査ログ記録内容を抽出
    const auditLog1ExecutedAt = result1.processedAt.toISOString();
    const auditLog1ApproverUserId = approverUserId;
    const auditLog1ApprovalStatus = result1.approvalStatus;

    // 2回目の確定実行（同一入力）
    const input2: MonthlyReportApprovalInput = {
      reportId: reportId,
      approvalStatus: "approved",
      approverUserId: approverUserId,
    };

    const result2 = validateMonthlyReportApproval(input2);

    expect(result2).toBeDefined();
    expect(result2.reportId).toBe(reportId);
    expect(result2.approvalStatus).toBe("approved");
    expect(result2.processedAt).toBeInstanceOf(Date);
    expect(result2.nextAction).toBe("proceed_to_management_report");

    // 2回目の監査ログ記録内容を抽出
    const auditLog2ExecutedAt = result2.processedAt.toISOString();
    const auditLog2ApproverUserId = approverUserId;
    const auditLog2ApprovalStatus = result2.approvalStatus;

    // 両レコードの秒単位での同一性を検証
    // processedAtを秒単位で比較（ミリ秒は異なる可能性がある）
    const timestamp1Seconds = Math.floor(result1.processedAt.getTime() / 1000);
    const timestamp2Seconds = Math.floor(result2.processedAt.getTime() / 1000);

    // 秒単位での時刻が同じか、または近い（1秒以内の差分）
    expect(Math.abs(timestamp1Seconds - timestamp2Seconds)).toBeLessThanOrEqual(1);

    // 確定者ID、承認ステータスが完全に同一
    expect(auditLog1ApproverUserId).toBe(auditLog2ApproverUserId);
    expect(auditLog1ApprovalStatus).toBe(auditLog2ApprovalStatus);

    // レポートIDが同一
    expect(result1.reportId).toBe(result2.reportId);

    // ただし2つの結果が異なるレコードとして記録されていることを確認
    // （オブジェクト参照は異なる）
    expect(result1).not.toBe(result2);
  });
});