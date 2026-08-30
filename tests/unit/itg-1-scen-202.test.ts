import { getSubmissionStatus } from "../../src/logic/report-submission-management";

describe("Report Submission Status Management", () => {
  // SCEN-202
  test("should throw error when teamMemberIds is empty array", () => {
    const now = new Date("2024-01-15T09:00:00Z");
    const deadlineTime = new Date("2024-01-15T09:30:00Z");

    const teamMemberIds: string[] = [];
    const submittedReportsByDate: Array<{ memberId: string; submittedAt: Date }> = [];
    const currentDateTime = now;
    const reportDeadlineTime = deadlineTime;

    expect(() =>
      getSubmissionStatus(
        teamMemberIds,
        submittedReportsByDate,
        reportDeadlineTime,
        currentDateTime
      )
    ).toThrow(/チームメンバー情報/);
  });
});