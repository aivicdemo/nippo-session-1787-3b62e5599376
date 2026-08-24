import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";

describe("部長向けダッシュボード提出状況リアルタイム表示機能", () => {
  // SCEN-108: [error] 部長ダッシュボード提出状況リアルタイム表示機能 - メンバーのユーザー ID が null のとき、エラーが発生する
  test("メンバーのユーザーIDがnullのとき、バリデーションエラーを発生させる", () => {
    const input = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      requestUserId: "user-manager-001",
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/ユーザーID/);
  });
});