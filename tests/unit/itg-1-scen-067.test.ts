import { submitDailyReport } from "../../src/logic/daily-report-management";
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from "../../src/logic/daily-report-management";

describe("Daily Report Submission - Submission Timestamp Null Error", () => {
  // SCEN-067
  test("should return error when submission timestamp is null", async () => {
    const input: SubmitDailyReportInput = {
      userId: "user-001",
      teamId: "team-001",
      yesterdayAccomplishment: "Completed API integration testing",
      todayPlan: "Deploy to staging environment",
      challenges: "Database connection timeout issues",
      reportDate: "2024-01-15",
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockGetCurrentTimestamp = jest.fn().mockReturnValue(null);

    let errorThrown: Error | null = null;
    try {
      await submitDailyReport(
        input,
        mockNotificationAdapter,
        mockGetCurrentTimestamp
      );
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown?.message).toMatch(/E001_SUBMISSION_TIMESTAMP_NULL/);
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});