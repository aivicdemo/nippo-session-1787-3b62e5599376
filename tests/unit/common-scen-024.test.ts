import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-024: AIエージェント定時実行時に日報提出状況を取得し未提出者を識別する", async () => {
    // Setup: テスト用の固定値
    const targetDate = new Date("2024-01-15T09:00:00Z");
    const teamMembers = [
      { memberId: "M001", memberName: "太郎", email: "taro@example.com" },
      { memberId: "M002", memberName: "次郎", email: "jiro@example.com" },
      { memberId: "M003", memberName: "三郎", email: "saburo@example.com" },
      { memberId: "M004", memberName: "四郎", email: "shiro@example.com" },
      { memberId: "M005", memberName: "五郎", email: "goro@example.com" },
      { memberId: "M006", memberName: "六郎", email: "rokuro@example.com" },
      { memberId: "M007", memberName: "七郎", email: "shichiro@example.com" },
      { memberId: "M008", memberName: "八郎", email: "hachiro@example.com" },
      { memberId: "M009", memberName: "九郎", email: "kuro@example.com" },
      { memberId: "M010", memberName: "十郎", email: "juro@example.com" },
    ];

    // 提出状況: 7名提出、3名未提出
    const submissionStatus = [
      { memberId: "M001", memberName: "太郎", submitted: false, submittedAt: null },
      { memberId: "M002", memberName: "次郎", submitted: false, submittedAt: null },
      { memberId: "M003", memberName: "三郎", submitted: false, submittedAt: null },
      { memberId: "M004", memberName: "四郎", submitted: true, submittedAt: "2024-01-15T08:30:00Z" },
      { memberId: "M005", memberName: "五郎", submitted: true, submittedAt: "2024-01-15T08:45:00Z" },
      { memberId: "M006", memberName: "六郎", submitted: true, submittedAt: "2024-01-15T08:50:00Z" },
      { memberId: "M007", memberName: "七郎", submitted: true, submittedAt: "2024-01-15T08:55:00Z" },
      { memberId: "M008", memberName: "八郎", submitted: true, submittedAt: "2024-01-15T08:52:00Z" },
      { memberId: "M009", memberName: "九郎", submitted: true, submittedAt: "2024-01-15T08:58:00Z" },
      { memberId: "M010", memberName: "十郎", submitted: true, submittedAt: "2024-01-15T08:40:00Z" },
    ];

    const unsubmittedMembers = submissionStatus.filter((s) => !s.submitted);
    const submittedCount = submissionStatus.filter((s) => s.submitted).length;
    const unsubmittedCount = unsubmittedMembers.length;

    // Call: sendUnsubmittedReminder関数を実行
    const result = await sendUnsubmittedReminder({
      targetDate,
      submissionStatus,
      teamMembers,
    });

    // Assertion: 基本的な実行結果を検証
    expect(result).toBeDefined();
    expect(result.executionTime).toBeDefined();
    expect(result.submittedCount).toBe(7);
    expect(result.unsubmittedCount).toBe(3);

    // Assertion: 未提出者が正確に識別されていることを確認
    expect(result.unsubmittedMembers).toHaveLength(3);
    expect(result.unsubmittedMembers.map((m) => m.memberId)).toEqual(["M001", "M002", "M003"]);
    expect(result.unsubmittedMembers.map((m) => m.memberName)).toEqual(["太郎", "次郎", "三郎"]);

    // Assertion: 未提出者のメールアドレスが含まれていることを確認
    expect(result.unsubmittedMembers.map((m) => m.email)).toEqual([
      "taro@example.com",
      "jiro@example.com",
      "saburo@example.com",
    ]);

    // Assertion: audit eventが記録されていることを確認
    expect(result.auditEvent).toBeDefined();
    expect(result.auditEvent.timestamp).toBeDefined();
    expect(result.auditEvent.action).toBe("fetch_submission_status");
    expect(result.auditEvent.totalMembers).toBe(10);
    expect(result.auditEvent.submittedCount).toBe(7);
    expect(result.auditEvent.unsubmittedCount).toBe(3);

    // Assertion: オーケストレータの状態が確定状態で保持されていることを確認
    expect(result.orchestratorState).toBeDefined();
    expect(result.orchestratorState.action01Completed).toBe(true);
    expect(result.orchestratorState.submissionStatusObtained).toBe(true);

    // Assertion: audit event内に『提出状況』フォーマットが含まれていることを確認
    expect(result.auditEvent.summary).toMatch(/提出済み.*7名/);
    expect(result.auditEvent.summary).toMatch(/未提出.*3名/);
    expect(result.auditEvent.summary).toMatch(/太郎/);
    expect(result.auditEvent.summary).toMatch(/次郎/);
    expect(result.auditEvent.summary).toMatch(/三郎/);
  });
});