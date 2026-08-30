import { detectUnsubmittedMembers } from "../../src/logic/report-submission-management";

describe("朝会報告管理システム - 未提出メンバー検出", () => {
  // SCEN-045
  test("reportDate時点を基準に未提出メンバーを検出し、催促対象者リストと遅延フラグを返す", async () => {
    const teamId = "team-001";
    const reportDate = new Date("2026-08-19T00:00:00Z");
    const evaluationTimestamp = new Date("2026-08-19T10:00:00Z");
    const includeDelayedOnly = false;

    // スタブ: getReportSubmissionDeadline
    const reportDeadlineTime = new Date("2026-08-19T09:00:00Z");

    // スタブ: getSubmissionStatus - 提出状況を返す
    const submissionStatusMap = new Map([
      ["member-A", { status: "submitted", submittedAt: new Date("2026-08-19T08:45:00Z") }],
      ["member-B", { status: "unsubmitted", submittedAt: null }],
      ["member-C", { status: "unsubmitted", submittedAt: null }],
      ["member-D", { status: "unsubmitted", submittedAt: null }],
      ["member-E", { status: "submitted", submittedAt: new Date("2026-08-19T09:15:00Z") }],
      ["member-F", { status: "submitted", submittedAt: new Date("2026-08-19T08:30:00Z") }],
      ["member-G", { status: "submitted", submittedAt: new Date("2026-08-19T08:20:00Z") }],
      ["member-H", { status: "submitted", submittedAt: new Date("2026-08-19T08:50:00Z") }],
      ["member-I", { status: "submitted", submittedAt: new Date("2026-08-19T08:40:00Z") }],
      ["member-J", { status: "submitted", submittedAt: new Date("2026-08-19T09:00:00Z") }],
    ]);

    // スタブ: calculateRemainingTimeToDeadline
    const remainingTimeMap = new Map([
      ["member-A", { remainingMinutes: 15, isOverdue: false }],
      ["member-B", { remainingMinutes: -60, isOverdue: true }], // 期限超過1時間前（未提出）
      ["member-C", { remainingMinutes: 30, isOverdue: false }],
      ["member-D", { remainingMinutes: -30, isOverdue: true }], // 期限超過30分前（未提出）
      ["member-E", { remainingMinutes: -15, isOverdue: true }], // 期限超過15分（提出済み・期限超過）
      ["member-F", { remainingMinutes: 30, isOverdue: false }],
      ["member-G", { remainingMinutes: 40, isOverdue: false }],
      ["member-H", { remainingMinutes: 10, isOverdue: false }],
      ["member-I", { remainingMinutes: 20, isOverdue: false }],
      ["member-J", { remainingMinutes: 0, isOverdue: false }],
    ]);

    // モック関数の準備
    const mockGetReportSubmissionDeadline = jest.fn().mockReturnValue(reportDeadlineTime);
    const mockGetSubmissionStatus = jest.fn().mockImplementation((memberId: string) => {
      return submissionStatusMap.get(memberId);
    });
    const mockCalculateRemainingTimeToDeadline = jest.fn().mockImplementation((memberId: string) => {
      return remainingTimeMap.get(memberId);
    });

    // detectUnsubmittedMembersを呼び出す
    const result = await detectUnsubmittedMembers(
      teamId,
      reportDate,
      evaluationTimestamp,
      includeDelayedOnly,
      mockGetReportSubmissionDeadline,
      mockGetSubmissionStatus,
      mockCalculateRemainingTimeToDeadline
    );

    // 検証: unsubmittedMembersフィールド - 未提出メンバーは4名（B, C, D, E）
    expect(result.unsubmittedMembers).toHaveLength(4);
    const unsubmittedMemberIds = result.unsubmittedMembers.map((m) => m.memberId);
    expect(unsubmittedMemberIds).toContain("member-B");
    expect(unsubmittedMemberIds).toContain("member-C");
    expect(unsubmittedMemberIds).toContain("member-D");
    expect(unsubmittedMemberIds).toContain("member-E");

    // 検証: totalUnsubmittedCount - 値が4であることを確認
    expect(result.totalUnsubmittedCount).toBe(4);

    // 検証: delayedMemberCount - 期限超過メンバーは2名（D, E）
    expect(result.delayedMemberCount).toBe(2);

    // 検証: detectionTimestamp - 値がevaluationTimestampと同じであることを確認
    expect(result.detectionTimestamp).toEqual(evaluationTimestamp);
  });
});