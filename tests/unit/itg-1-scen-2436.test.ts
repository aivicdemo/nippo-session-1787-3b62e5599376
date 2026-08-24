import { describe, test, expect } from "@jest/globals";
import { validateMonthlyReportApproval } from "../../src/logic/monthly-performance-analysis";

describe("課題の影響度判定と優先度付け表示機能", () => {
  test("SCEN-2436: プロジェクトマネージャーIDが未指定のとき監査ログ記録が失敗する", () => {
    const analysisData = {
      extractedKeywords: [
        { keyword: "パフォーマンス低下", frequency: 5, impactScore: 85 },
        { keyword: "メモリリーク", frequency: 3, impactScore: 92 },
      ],
      analyzedAt: "2024-01-15T10:30:00Z",
      teamId: "team-001",
      analysisId: "analysis-001",
    };

    const invalidExecutorId_null = null;
    const invalidExecutorId_empty = "";

    expect(() => {
      validateMonthlyReportApproval({
        reportId: "report-001",
        approvalStatus: "approved",
        approverUserId: "user-dept-head",
        executorId: invalidExecutorId_null,
        analysisData: analysisData,
        auditLogEnabled: true,
      });
    }).toThrow(/実行者ID|INVALID_EXECUTOR_ID|executor/i);

    expect(() => {
      validateMonthlyReportApproval({
        reportId: "report-001",
        approvalStatus: "approved",
        approverUserId: "user-dept-head",
        executorId: invalidExecutorId_empty,
        analysisData: analysisData,
        auditLogEnabled: true,
      });
    }).toThrow(/実行者ID|INVALID_EXECUTOR_ID|executor/i);
  });
});