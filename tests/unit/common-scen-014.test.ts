import { listRemindSchedules } from "../../src/logic/remind-schedule-management";
import { type ListRemindSchedulesInput } from "../../src/logic/remind-schedule-management";

describe("listRemindSchedules", () => {
  // SCEN-014
  test("should throw error when user lacks access permission to remind notification management screen", () => {
    const input: ListRemindSchedulesInput = {
      userId: "user-without-permission",
      filterStatus: "all",
    };

    expect(() => listRemindSchedules(input)).toThrow(
      /リマインド通知管理画面へのアクセス権限/
    );
  });
});