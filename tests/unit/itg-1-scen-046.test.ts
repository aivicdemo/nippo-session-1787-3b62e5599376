import { detectUnsubmittedMembers } from "../../src/logic/report-submission-management";

describe("朝会報告管理システム - 未提出メンバー検出", () => {
  test("SCEN-046: 報告日が未来日の場合、InvalidReportDateErrorをスロー", () => {
    const currentDate = new Date("2026-08-19");
    const futureReportDate = new Date("2026-08-20");

    const teamMemberIds = ["user-001", "user-002", "user-003"];
    const submittedReportsByDate = [
      { memberId: "user-001", submittedAt: new Date("2026-08-19T08:00:00Z") },
    ];
    const evaluationTimestamp = currentDate;

    expect(() =>
      detectUnsubmittedMembers(
        teamMemberIds,
        submittedReportsByDate,
        futureReportDate,
        evaluationTimestamp
      )
    ).toThrow(/報告日/);
  });
});