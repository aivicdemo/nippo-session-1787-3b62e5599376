import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndNotifyUnsubmittedMembers } from "../../src/logic/submission-status-tracking";
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput } from "../../src/logic/submission-status-tracking";

describe("未提出メンバー抽出機能", () => {
  // SCEN-1652: [error] 本日の日時基準値が未指定のまま未提出判定を実行しようとしたとき、処理を中止しエラーを返す
  it("should return ERR_REFERENCE_DATE_NOT_SET error when reference date is not set", async () => {
    const input: DetectUnsubmittedMembersInput = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      morningMeetingStartTime: "09:00",
      executorUserId: "user-manager-001"
    };

    const result = await detectAndNotifyUnsubmittedMembers(input, {
      getReferenceDate: async () => null,
      getTeamMembers: async () => [],
      getSubmissionStatus: async () => [],
      sendNotification: async () => ({ success: true, sentCount: 0 }),
      logAuditEvent: async () => undefined
    });

    expect(result).toHaveProperty("error");
    expect((result as any).error?.code).toBe("ERR_REFERENCE_DATE_NOT_SET");
    expect((result as any).error?.message).toMatch(/基準値/);
  });
});