import { detectAndNotifyUnsubmittedMembers } from "../../src/logic/submission-status-tracking";

describe("submission-status-tracking: detectAndNotifyUnsubmittedMembers", () => {
  test("SCEN-2822: throws error when prompter judgment logic returns null", () => {
    // Setup: Create test data for unsubmitted members
    const unsubmittedMembers = [
      {
        userId: "user-001",
        userName: "田中太郎",
        email: "tanaka@example.com",
        remainingMinutes: -15,
      },
      {
        userId: "user-002",
        userName: "鈴木花子",
        email: "suzuki@example.com",
        remainingMinutes: -30,
      },
      {
        userId: "user-003",
        userName: "佐藤次郎",
        email: "sato@example.com",
        remainingMinutes: -45,
      },
      {
        userId: "user-004",
        userName: "伊藤美咲",
        email: "ito@example.com",
        remainingMinutes: -20,
      },
      {
        userId: "user-005",
        userName: "山田健一",
        email: "yamada@example.com",
        remainingMinutes: -60,
      },
      {
        userId: "user-006",
        userName: "中村由美",
        email: "nakamura@example.com",
        remainingMinutes: -10,
      },
      {
        userId: "user-007",
        userName: "小林翔太",
        email: "kobayashi@example.com",
        remainingMinutes: -25,
      },
      {
        userId: "user-008",
        userName: "加藤真由美",
        email: "kato@example.com",
        remainingMinutes: -40,
      },
      {
        userId: "user-009",
        userName: "渡辺拓也",
        email: "watanabe@example.com",
        remainingMinutes: -35,
      },
      {
        userId: "user-010",
        userName: "林結衣",
        email: "hayashi@example.com",
        remainingMinutes: -50,
      },
    ];

    // Setup: Create stub function that returns null (simulating prompter judgment failure)
    const prompterJudgmentStub = jest.fn().mockReturnValue(null);

    // Setup: Input parameters for detectAndNotifyUnsubmittedMembers
    const input = {
      teamId: "team-marketing",
      reportDate: "2024-01-15",
      morningMeetingStartTime: "09:00",
      executorUserId: "admin-user-001",
    };

    // Execute: Call the function with null-returning prompter judgment stub
    // Expected: Should throw error with specific message about prompter judgment failure
    expect(() => {
      detectAndNotifyUnsubmittedMembers(input, prompterJudgmentStub);
    }).toThrow(/催促対象者の判定に失敗しました/);

    // Verify: Error message contains error code for prompter judgment failure
    expect(() => {
      detectAndNotifyUnsubmittedMembers(input, prompterJudgmentStub);
    }).toThrow(/E_PROMPTER_JUDGE_NULL/);

    // Verify: Processing stopped and no partial list was returned
    // (The function threw before returning any result)
  });
});