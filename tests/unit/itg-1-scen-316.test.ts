import { getSubmissionStatus } from "../../src/logic/report-submission-management";
import type { SubmissionStatusQueryInput } from "../../src/logic/report-submission-management";

describe("朝会報告管理システム - 提出状況集計", () => {
  test("SCEN-316: 提出期限の時刻が無効な形式のときエラーをスロー", () => {
    const input: SubmissionStatusQueryInput = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      requesterId: "user-requester",
      reportDeadlineTime: "25:99",
    };

    expect(() => getSubmissionStatus(input)).toThrow(/提出期限の時刻形式/);
  });
});