import { createRemindSchedule } from "../../src/logic/remind-schedule-management";
import { type CreateRemindScheduleInput } from "../../src/logic/remind-schedule-management";

describe("共通", () => {
  // SCEN-002
  test("新規リマインド通知スケジュール作成時、業務ルール違反（送信時刻未設定）でエラーをthrowする", () => {
    const invalidInput: CreateRemindScheduleInput = {
      scheduleName: "test-schedule",
      sendTime: "",
      targetTeamIds: ["team-001"],
      targetMemberIds: ["member-001"],
      isEnabled: true,
    };

    expect(() => createRemindSchedule(invalidInput)).toThrow(/スケジュール設定が無効です/);
  });

  test("新規リマインド通知スケジュール作成時、業務ルール違反（対象チーム空配列）でエラーをthrowする", () => {
    const invalidInput: CreateRemindScheduleInput = {
      scheduleName: "test-schedule",
      sendTime: "09:00",
      targetTeamIds: [],
      targetMemberIds: ["member-001"],
      isEnabled: true,
    };

    expect(() => createRemindSchedule(invalidInput)).toThrow(/スケジュール設定が無効です/);
  });

  test("新規リマインド通知スケジュール作成時、業務ルール違反（対象メンバー空配列）でエラーをthrowする", () => {
    const invalidInput: CreateRemindScheduleInput = {
      scheduleName: "test-schedule",
      sendTime: "09:00",
      targetTeamIds: ["team-001"],
      targetMemberIds: [],
      isEnabled: true,
    };

    expect(() => createRemindSchedule(invalidInput)).toThrow(/スケジュール設定が無効です/);
  });
});