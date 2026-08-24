import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from "../../src/logic/submission-status-tracking";

describe("報告提出状況リアルタイム集計機能", () => {
  // SCEN-418
  test("部長ユーザーIDが空文字列のとき処理が中断されエラーを返す", () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      requestUserId: "",
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/ユーザーID/);
  });
});