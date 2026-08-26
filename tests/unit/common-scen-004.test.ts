import { createRemindSchedule } from "../../src/logic/remind-schedule-management";

describe("共通", () => {
  // SCEN-004
  test("should throw error with message when schedule persisting to database fails", async () => {
    const createRemindScheduleInput = {
      scheduleName: "朝会報告リマインド",
      sendTime: "07:00",
      targetTeamIds: [],
      targetMemberIds: ["member-001", "member-002", "member-003"],
      isEnabled: true,
    };

    await expect(
      createRemindSchedule(createRemindScheduleInput)
    ).rejects.toThrow(/スケジュール設定の保存に失敗しました/);
  });
});