import { authorizeScheduleOperation } from "../../src/logic/remind-notification-authorization";

describe("authorize schedule operation", () => {
  // SCEN-045
  test("should authorize MEMBER user to create schedule", () => {
    const userId = "user001";
    const operationType = "create";
    const targetTeamId = "team001";
    const scheduleId = null;

    const result = authorizeScheduleOperation({
      userId,
      operationType: operationType as "create" | "update" | "delete" | "toggle",
      targetTeamId,
      scheduleId,
    });

    expect(result.authorized).toBe(true);
  });
});