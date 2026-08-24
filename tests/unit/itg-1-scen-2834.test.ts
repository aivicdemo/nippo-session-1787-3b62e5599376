import { detectAndNotifyUnsubmittedMembers } from "../../src/logic/submission-status-tracking";

describe("未提出メンバー優先度判定機能", () => {
  test("SCEN-2834: 優先度スコアが逆順（低い順）で並ぶ入力に対して昇順に再並べ替えされる", async () => {
    const teamId = "team-001";
    const reportDate = "2024-01-15";
    const morningMeetingStartTime = "09:00";
    const executorUserId = "exec-001";

    const unsubmittedMembers = [
      {
        userId: "M001",
        userName: "Member One",
        email: "member1@example.com",
        remainingMinutes: 45,
        priorityScore: 20,
      },
      {
        userId: "M002",
        userName: "Member Two",
        email: "member2@example.com",
        remainingMinutes: 30,
        priorityScore: 15,
      },
      {
        userId: "M003",
        userName: "Member Three",
        email: "member3@example.com",
        remainingMinutes: 60,
        priorityScore: 30,
      },
    ];

    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: true,
        sentAt: new Date("2024-01-15T08:30:00Z"),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "sent",
      }),
    };

    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        morningMeetingStartTime,
        executorUserId,
      },
      notificationServiceAdapter
    );

    expect(result.unsubmittedMembers).toHaveLength(3);
    expect(result.unsubmittedMembers[0].priorityScore).toBe(15);
    expect(result.unsubmittedMembers[0].userId).toBe("M002");
    expect(result.unsubmittedMembers[1].priorityScore).toBe(20);
    expect(result.unsubmittedMembers[1].userId).toBe("M001");
    expect(result.unsubmittedMembers[2].priorityScore).toBe(30);
    expect(result.unsubmittedMembers[2].userId).toBe("M003");
  });
});