import { createRemindSchedule } from "../../src/logic/remind-schedule-management";

describe("共通", () => {
  // SCEN-004
  test("should throw error with message when schedule persistence fails", async () => {
    const input = {
      scheduleName: "朝会報告リマインド",
      sendTime: "07:00",
      targetTeamIds: [],
      targetMemberIds: ["member1", "member2", "member3"],
      isEnabled: true,
    };

    await expect(createRemindSchedule(input)).rejects.toThrow(
      /スケジュール設定の保存に失敗しました/
    );
  });
});