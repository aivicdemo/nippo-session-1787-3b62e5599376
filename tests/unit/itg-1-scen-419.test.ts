import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";

describe("報告提出状況リアルタイム集計機能", () => {
  test("SCEN-419: 対象日付が未来日付のとき処理が中断されエラーを返す", () => {
    const input = {
      teamId: "team-001",
      reportDate: "2026-08-20",
      requestUserId: "user-001",
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/未来日付/);
  });
});