import { toggleRemindScheduleStatus } from "../../src/logic/remind-schedule-management";

describe("toggleRemindScheduleStatus", () => {
  // SCEN-012
  test("should return persistence error when database save fails", () => {
    const toggleInput = {
      scheduleId: "schedule-001",
      enabled: false,
      userId: "user-123",
    };

    expect(() => toggleRemindScheduleStatus(toggleInput)).toThrow(
      /保存に失敗/
    );
  });
});