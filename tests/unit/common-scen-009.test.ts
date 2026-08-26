import { toggleRemindScheduleStatus } from "../../src/logic/remind-schedule-management";

describe("toggleRemindScheduleStatus", () => {
  // SCEN-009
  test("should toggle schedule status from enabled to disabled and back, persisting each change", () => {
    const scheduleId = "schedule-001";
    const userId = "user-123";

    // First toggle: enabled (true) → disabled (false)
    const resultFirstToggle = toggleRemindScheduleStatus({
      scheduleId,
      enabled: false,
      userId,
    });

    expect(resultFirstToggle.isEnabled).toBe(false);

    // Second toggle: disabled (false) → enabled (true)
    const resultSecondToggle = toggleRemindScheduleStatus({
      scheduleId,
      enabled: true,
      userId,
    });

    expect(resultSecondToggle.isEnabled).toBe(true);
    expect(resultSecondToggle.scheduleId).toBe(scheduleId);
  });
});