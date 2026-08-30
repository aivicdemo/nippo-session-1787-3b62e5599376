import { aggregateSubmissionStatusSummary } from "../../src/logic/dashboard-presentation";

describe("aggregateSubmissionStatusSummary", () => {
  // SCEN-070: [error] 指定日付のチームメンバー報告提出状況を集計し、提出済み件数・未提出件数・提出率をサマリー形式で返す。 - 指定チームにメンバーが存在しない場合
  test("should throw NoTeamMembersError when specified team has no members registered", () => {
    const teamId = "team-no-members";
    const reportDate = "2026-08-19";
    const requestUserId = "user-001";

    expect(() => {
      aggregateSubmissionStatusSummary({
        teamId,
        reportDate,
        requestUserId,
      });
    }).toThrow(/メンバーが登録されていません/);
  });
});