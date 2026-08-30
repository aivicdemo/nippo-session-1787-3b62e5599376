import { aggregateSubmissionStatusSummary } from "../../src/logic/dashboard-presentation";
import type {
  SubmissionStatusAggregationInput,
  SubmissionStatusSummary,
  UnsubmittedMember,
} from "../../src/logic/dashboard-presentation";

jest.mock("../../src/logic/dashboard-presentation", () => {
  const actual = jest.requireActual(
    "../../src/logic/dashboard-presentation"
  );
  return {
    ...actual,
    judgeAccessPermission: jest.fn(),
    getSubmissionStatus: jest.fn(),
  };
});

describe("aggregateSubmissionStatusSummary", () => {
  // SCEN-068: [normal] 指定日付のチームメンバー報告提出状況を集計し、提出済み件数・未提出件数・提出率をサマリー形式で返す。
  test("should aggregate submission status summary with correct submission rate", async () => {
    const {
      judgeAccessPermission,
      getSubmissionStatus,
    } = require("../../src/logic/dashboard-presentation");

    const unsubmittedMembersData: UnsubmittedMember[] = [
      {
        memberId: "user-c",
        memberName: "ユーザーC",
      },
      {
        memberId: "user-d",
        memberName: "ユーザーD",
      },
    ];

    judgeAccessPermission.mockResolvedValue({
      hasAccess: true,
      accessLevel: "full",
    });

    getSubmissionStatus.mockResolvedValue({
      totalMemberCount: 10,
      submittedCount: 8,
      unsubmittedMembers: unsubmittedMembersData,
    });

    const input: SubmissionStatusAggregationInput = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      requestUserId: "user-admin",
    };

    const result: SubmissionStatusSummary =
      await aggregateSubmissionStatusSummary(input);

    expect(result.totalMemberCount).toBe(10);
    expect(result.submittedCount).toBe(8);
    expect(result.unsubmittedMembers).toHaveLength(2);
    expect(result.unsubmittedMembers[0]).toEqual({
      memberId: "user-c",
      memberName: "ユーザーC",
    });
    expect(result.unsubmittedMembers[1]).toEqual({
      memberId: "user-d",
      memberName: "ユーザーD",
    });
    expect(result.submissionRate).toBe(80);

    expect(judgeAccessPermission).toHaveBeenCalledWith(
      "user-admin",
      "team-001"
    );
    expect(getSubmissionStatus).toHaveBeenCalledWith("team-001", "2024-01-15");
  });
});