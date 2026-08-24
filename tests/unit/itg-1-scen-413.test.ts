import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from "../../src/logic/submission-status-tracking";

describe("報告提出状況リアルタイム集計機能", () => {
  // SCEN-413
  test("報告期限設定情報が null のとき処理が中断されエラーを返す", () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      requestUserId: "user-manager-001",
      includeDelayedSubmissions: true,
    };

    const result = aggregateReportSubmissionStatus(input, null);

    expect(result).toEqual({
      code: "DEADLINE_CONFIG_NULL",
      message: "報告期限設定情報が未設定です",
    });
  });
});