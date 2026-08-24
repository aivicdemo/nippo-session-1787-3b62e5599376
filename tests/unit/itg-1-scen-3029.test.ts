import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from "../../src/logic/submission-status-tracking";

describe("部長向けダッシュボードに本日の報告提出状況をリアルタイム表示", () => {
  // SCEN-3029
  test("チームIDが null のとき、提出状況の集計処理がエラーになる", () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: null as unknown as string,
      reportDate: "2024-01-15",
      requestUserId: "user-001",
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/チームID/);
  });
});