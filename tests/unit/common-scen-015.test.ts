import { listRemindSchedules } from "../../src/logic/remind-schedule-management";
import { type ListRemindSchedulesInput } from "../../src/logic/remind-schedule-management";

const fetchMock = require("jest-fetch-mock");

describe("RemindScheduleManagement", () => {
  // SCEN-015
  test("should return error message when database fails to load schedule data", async () => {
    fetchMock.resetMocks();

    const input: ListRemindSchedulesInput = {
      userId: "user-123",
      filterStatus: "all",
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: "Database connection failed",
      }),
      { status: 500 }
    );

    const result = await listRemindSchedules(input);

    expect(result).toEqual(
      expect.objectContaining({
        isValid: false,
      })
    );

    expect(result.errors).toBeDefined();
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringMatching(/スケジュール情報の取得に失敗しました/),
      })
    );
  });
});