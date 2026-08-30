import { sendConfirmationEmailToManager } from "../../src/logic/reminder-notification-service";
import type { ManagerConfirmationEmailInput } from "../../src/logic/reminder-notification-service";

describe("朝会報告管理システム - 確認メール生成・配信", () => {
  test("SCEN-082: 日報集約データが不正な場合、InvalidAggregationDataError が発生し、メール送信は実行されない", () => {
    // Arrange: aggregationDate が空文字列の不完全な ManagerConfirmationEmailInput を構築
    const invalidInput: ManagerConfirmationEmailInput = {
      managerUserId: "manager-001",
      aggregationDate: "", // 不正: 空文字列
      unsubmittedMembers: [
        {
          memberId: "user-002",
          memberName: "田中太郎",
          memberEmail: "tanaka@example.com",
        },
      ],
      prioritizedIssues: [
        {
          issueKeyword: "バグ",
          frequency: 3,
          impactScore: 75,
          priorityRank: 1,
          priorityLevel: "high",
        },
      ],
      submissionDeadline: "2024-01-15T09:00:00Z",
      teamId: "team-001",
    };

    // Act & Assert: 関数を呼び出し、エラーが発生することを検証
    expect(() => sendConfirmationEmailToManager(invalidInput)).toThrow(
      /日報集約データが不正です/
    );
  });
});