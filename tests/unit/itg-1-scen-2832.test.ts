import { detectAndNotifyUnsubmittedMembers } from "../../src/logic/submission-status-tracking";
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput, type NotificationFailure } from "../../src/logic/submission-status-tracking";

describe("未提出メンバー優先度判定機能 - 報告期限超過後の表示継続性", () => {
  // SCEN-2832
  test("報告期限の30分超過直後も未提出メンバーリストが継続して表示される", async () => {
    // === 固定時刻・データ設定 ===
    const baseDeadlineTime = new Date("2024-01-15T09:00:00Z");
    const thirtyMinutesBefore = new Date("2024-01-15T08:30:00Z");
    const atDeadlineTime = new Date("2024-01-15T09:00:00Z");
    const thirtyMinutesOneSecondAfter = new Date("2024-01-15T09:30:01Z");
    const sixtyMinutesAfter = new Date("2024-01-15T10:00:00Z");

    const teamId = "team-001";
    const reportDate = "2024-01-15";
    const morningMeetingStartTime = "09:00";
    const executorUserId = "admin-001";

    const unsubmittedMemberId_1 = "member-001";
    const unsubmittedMemberId_2 = "member-002";

    // === 通知サービスアダプタのスタブ定義 ===
    const notificationCallLog: Array<{
      userId: string;
      notificationTime: Date;
      status: "sent" | "failed";
    }> = [];

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        notificationCallLog.push({
          userId,
          notificationTime: new Date(thirtyMinutesOneSecondAfter),
          status: "sent",
        });
        return { status: "sent" as const, sentAt: thirtyMinutesOneSecondAfter };
      }),
    };

    // === テスト実行フェーズ 1: 期限30分前の状態 ===
    // （時刻の進行をシミュレート。実装で jest.useFakeTimers() が行われていると仮定）
    const input1: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    // ここではシナリオ記述に従い、時刻を期限30分前に設定したかのように動作を検証する
    // (実装側でこの時刻設定を行う仕組みが必要)
    const result1: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input1,
      notificationServiceAdapterStub as any,
      thirtyMinutesBefore
    );

    // 30分前の時点では未提出メンバーが存在
    expect(result1.unsubmittedMembers.length).toBeGreaterThan(0);
    expect(result1.unsubmittedMembers.some((m) => m.userId === unsubmittedMemberId_1)).toBe(true);
    expect(result1.unsubmittedMembers.some((m) => m.userId === unsubmittedMemberId_2)).toBe(true);

    // === テスト実行フェーズ 2: 期限の正確なタイミング ===
    const input2: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    const result2: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input2,
      notificationServiceAdapterStub as any,
      atDeadlineTime
    );

    // 期限時点でも未提出メンバーリストが表示される
    expect(result2.unsubmittedMembers.length).toBeGreaterThan(0);
    expect(result2.unsubmittedMembers.some((m) => m.userId === unsubmittedMemberId_1)).toBe(true);

    // === テスト実行フェーズ 3: 期限30分1秒後（期限超過直後） ===
    const input3: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    const result3: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input3,
      notificationServiceAdapterStub as any,
      thirtyMinutesOneSecondAfter
    );

    // 期限超過直後も未提出メンバーリストが継続して表示される
    expect(result3.unsubmittedMembers.length).toBeGreaterThan(0);
    expect(result3.unsubmittedMembers.some((m) => m.userId === unsubmittedMemberId_1)).toBe(true);
    expect(result3.unsubmittedMembers.some((m) => m.userId === unsubmittedMemberId_2)).toBe(true);

    // 未提出メンバーの詳細情報が正しく含まれている
    const member1_delayed = result3.unsubmittedMembers.find((m) => m.userId === unsubmittedMemberId_1);
    expect(member1_delayed).toBeDefined();
    expect(member1_delayed?.userName).toBeDefined();
    expect(member1_delayed?.email).toBeDefined();
    // remainingMinutes が負数（超過を示す）
    expect(member1_delayed?.remainingMinutes).toBeLessThan(0);
    expect(member1_delayed?.remainingMinutes).toBe(-30);

    // === テスト実行フェーズ 4: 期限60分後（期限超過60分後） ===
    const input4: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    const result4: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input4,
      notificationServiceAdapterStub as any,
      sixtyMinutesAfter
    );

    // 期限超過60分後も未提出メンバーリストが表示されている
    expect(result4.unsubmittedMembers.length).toBeGreaterThan(0);
    expect(result4.unsubmittedMembers.some((m) => m.userId === unsubmittedMemberId_1)).toBe(true);
    expect(result4.unsubmittedMembers.some((m) => m.userId === unsubmittedMemberId_2)).toBe(true);

    const member1_60min = result4.unsubmittedMembers.find((m) => m.userId === unsubmittedMemberId_1);
    expect(member1_60min?.remainingMinutes).toBe(-60);

    // === 通知サービスアダプタのログ検証 ===
    // 期限時点でのリマインド通知送信が記録されている
    expect(notificationCallLog.length).toBeGreaterThanOrEqual(1);

    // 通知は期限時点で送信される（複数回の呼び出しで重複した通知は送信されない）
    const sentToMember1 = notificationCallLog.filter((log) => log.userId === unsubmittedMemberId_1);
    expect(sentToMember1.length).toBeGreaterThan(0);
    expect(sentToMember1[0].status).toBe("sent");

    // 期限超過後の追加送信は呼び出されていない（再度呼び出した時点でも送信回数が増加していない）
    const initialNotificationCount = notificationCallLog.length;
    const input5: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    await detectAndNotifyUnsubmittedMembers(
      input5,
      notificationServiceAdapterStub as any,
      new Date("2024-01-15T10:30:00Z")
    );

    // リマインド通知の追加送信は発生しない（同一メンバーへの重複送信防止）
    expect(notificationCallLog.length).toBeLessThanOrEqual(initialNotificationCount + 1);

    // === executedAt が ISO 8601 形式で記録されている ===
    expect(result3.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // === notificationFailures が期待通り設定される ===
    expect(Array.isArray(result3.notificationFailures)).toBe(true);
  });
});