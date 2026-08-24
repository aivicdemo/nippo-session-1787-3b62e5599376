import { describe, test, expect } from "@jest/globals";
import { aggregateReportSubmissionStatus } from "../../src/logic/submission-status-tracking";

describe("部長向けダッシュボード - 報告提出状況リアルタイム表示", () => {
  // SCEN-1080
  test("本日の朝会報告データが null のとき、提出状況判定がエラーになる", () => {
    const input = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      requestUserId: "user-manager-001",
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(
      /本日の朝会報告データが取得できません/
    );
  });
});