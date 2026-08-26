import { getDeadlineInfo, type DeadlineInfo } from "../../src/logic/report-deadline-management";

describe("report-deadline-management", () => {
  // SCEN-029
  test("should calculate remaining time and deadline info for normal input", () => {
    const currentDateTime = new Date("2024-01-15T09:00:00Z");
    const deadlineDateTime = new Date("2024-01-15T10:00:00Z");

    const result: DeadlineInfo = getDeadlineInfo({
      deadlineDateTime,
      currentDateTime,
    });

    expect(result.remainingMinutes).toBe(60);
    expect(result.deadlineAt).toBe("2024-01-15T10:00:00");
    expect(result.isOverdue).toBe(false);
    expect(result.isPastDeadline).toBe(false);
  });
});