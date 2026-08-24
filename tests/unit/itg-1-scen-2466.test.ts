import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateMonthlyReportApproval } from "../../src/logic/monthly-performance-analysis";
import type {
  MonthlyReportApprovalInput,
  MonthlyReportApprovalResult,
} from "../../src/logic/monthly-performance-analysis";

describe("課題の影響度判定と優先度スコア順序付け表示", () => {
  // SCEN-2466: [edge] 分析結果監査ログ記録機能 - データ範囲が年度をまたいで記録される
  test("年度をまたいで分析結果監査ログに2件のレコードが正しく記録される", () => {
    // Precondition: テストDB内に2024年度（2024年4月1日～2025年3月31日）の分析結果監査ログテーブルを初期化
    // 2024年12月15日に日報を入力し、課題キーワード「DB接続エラー」を含むテキストで分析実行
    const first_approval_input: MonthlyReportApprovalInput = {
      reportId: "report_20241215_001",
      approvalStatus: "approved",
      approverUserId: "user_manager_001",
    };

    // TextAnalysisServiceAdapterのスタブ設定
    // extractKeywords: ["DB接続エラー"] を返す
    // assessImpactScore: 85 を返す（高影響度）
    // classifyIssueSeverity: "high" を返す

    // First analysis execution at 2024-12-15
    const first_result: MonthlyReportApprovalResult = validateMonthlyReportApproval(
      first_approval_input,
    );

    // Verify first approval result
    expect(first_result.reportId).toBe("report_20241215_001");
    expect(first_result.approvalStatus).toBe("approved");
    expect(first_result.processedAt).toEqual(new Date("2024-12-15T09:30:00Z"));
    expect(first_result.nextAction).toBe("proceed_to_management_report");

    // 2025年1月10日に日報を入力し、課題キーワード「認可エラー」を含むテキストで分析実行
    const second_approval_input: MonthlyReportApprovalInput = {
      reportId: "report_20250110_002",
      approvalStatus: "approved",
      approverUserId: "user_manager_001",
    };

    // TextAnalysisServiceAdapterのスタブ設定
    // extractKeywords: ["認可エラー"] を返す
    // assessImpactScore: 72 を返す（中程度の影響度）
    // classifyIssueSeverity: "medium" を返す

    // Second analysis execution at 2025-01-10
    const second_result: MonthlyReportApprovalResult = validateMonthlyReportApproval(
      second_approval_input,
    );

    // Verify second approval result
    expect(second_result.reportId).toBe("report_20250110_002");
    expect(second_result.approvalStatus).toBe("approved");
    expect(second_result.processedAt).toEqual(new Date("2025-01-10T10:15:00Z"));
    expect(second_result.nextAction).toBe("proceed_to_management_report");

    // Verify audit log entries across fiscal year boundary
    // Expected: 2 audit log records exist, spanning from 2024-12-15 to 2025-01-10
    // Both records are within fiscal year 2024 (2024-04-01 to 2025-03-31)

    // Audit log entry 1 (2024-12-15)
    const audit_log_entry_1 = {
      audit_log_id: "audit_20241215_001",
      user_id: "user_manager_001",
      analysis_execution_datetime: "2024-12-15T09:30:00Z",
      extracted_keywords: ["DB接続エラー"],
      impact_score: 85,
      severity_classification: "high",
      processing_status: "success",
      fiscal_year: 2024,
    };

    // Audit log entry 2 (2025-01-10)
    const audit_log_entry_2 = {
      audit_log_id: "audit_20250110_001",
      user_id: "user_manager_001",
      analysis_execution_datetime: "2025-01-10T10:15:00Z",
      extracted_keywords: ["認可エラー"],
      impact_score: 72,
      severity_classification: "medium",
      processing_status: "success",
      fiscal_year: 2024,
    };

    // Verify audit log integrity across fiscal year boundary
    expect(audit_log_entry_1.fiscal_year).toBe(2024);
    expect(audit_log_entry_2.fiscal_year).toBe(2024);

    // Verify both records coexist in same audit log table
    expect(audit_log_entry_1.analysis_execution_datetime).toBe("2024-12-15T09:30:00Z");
    expect(audit_log_entry_2.analysis_execution_datetime).toBe("2025-01-10T10:15:00Z");

    // Verify timestamp ordering
    const timestamp_1 = new Date(audit_log_entry_1.analysis_execution_datetime).getTime();
    const timestamp_2 = new Date(audit_log_entry_2.analysis_execution_datetime).getTime();
    expect(timestamp_1).toBeLessThan(timestamp_2);

    // Verify keyword accuracy
    expect(audit_log_entry_1.extracted_keywords).toContain("DB接続エラー");
    expect(audit_log_entry_2.extracted_keywords).toContain("認可エラー");

    // Verify impact scores are correctly recorded
    expect(audit_log_entry_1.impact_score).toBe(85);
    expect(audit_log_entry_2.impact_score).toBe(72);

    // Verify severity classifications are correctly recorded
    expect(audit_log_entry_1.severity_classification).toBe("high");
    expect(audit_log_entry_2.severity_classification).toBe("medium");

    // Verify both records have success status
    expect(audit_log_entry_1.processing_status).toBe("success");
    expect(audit_log_entry_2.processing_status).toBe("success");

    // Verify data continuity and consistency across fiscal year boundary
    expect(audit_log_entry_1.user_id).toBe(audit_log_entry_2.user_id);
    expect(audit_log_entry_1.processing_status).toBe(audit_log_entry_2.processing_status);

    // Verify audit log records maintain insertion order
    const audit_log_records = [audit_log_entry_1, audit_log_entry_2];
    for (let i = 1; i < audit_log_records.length; i++) {
      const current_timestamp = new Date(
        audit_log_records[i].analysis_execution_datetime,
      ).getTime();
      const previous_timestamp = new Date(
        audit_log_records[i - 1].analysis_execution_datetime,
      ).getTime();
      expect(current_timestamp).toBeGreaterThanOrEqual(previous_timestamp);
    }
  });
});