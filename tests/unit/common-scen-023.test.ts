import { listNotificationHistory, type NotificationHistorySearchCriteria } from "../../src/logic/remind-notification-history";

describe("listNotificationHistory", () => {
  // SCEN-023
  test("should return error when search criteria are invalid (startDate > endDate or required fields missing)", async () => {
    // Pattern 1: startDate > endDate
    const invalidCriteria1: NotificationHistorySearchCriteria = {
      startDate: new Date("2024-01-31"),
      endDate: new Date("2024-01-01"),
      pageNumber: 1,
      pageSize: 10,
    };

    const result1 = await listNotificationHistory(invalidCriteria1);
    expect(result1).toHaveProperty("error");
    expect(result1.error).toMatch(/検索条件が不正です/);
    expect(result1).toHaveProperty("statusCode", 400);

    // Pattern 2: startDate is null (missing required field)
    const invalidCriteria2 = {
      startDate: null,
      endDate: new Date("2024-01-31"),
      pageNumber: 1,
      pageSize: 10,
    } as unknown as NotificationHistorySearchCriteria;

    const result2 = await listNotificationHistory(invalidCriteria2);
    expect(result2).toHaveProperty("error");
    expect(result2.error).toMatch(/検索条件が不正です/);
    expect(result2).toHaveProperty("statusCode", 400);

    // Pattern 3: both startDate and endDate are undefined (missing required fields)
    const invalidCriteria3: NotificationHistorySearchCriteria = {
      startDate: undefined as unknown as Date,
      endDate: undefined as unknown as Date,
      pageNumber: 1,
      pageSize: 10,
    };

    const result3 = await listNotificationHistory(invalidCriteria3);
    expect(result3).toHaveProperty("error");
    expect(result3.error).toMatch(/検索条件が不正です/);
    expect(result3).toHaveProperty("statusCode", 400);
  });
});