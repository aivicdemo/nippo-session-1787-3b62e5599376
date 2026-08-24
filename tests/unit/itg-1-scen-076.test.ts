import { submitDailyReport } from "../../src/logic/daily-report-management";

describe("Daily Report Submission - Deadline Exceeded Error", () => {
  test("SCEN-076: submitDailyReport returns DEADLINE_EXCEEDED error when submission time exceeds deadline", () => {
    // Arrange: Setup test data with deadline at 09:00
    const deadline = "09:00";
    const currentTime = new Date("2024-01-15T09:05:00Z"); // 5 minutes after deadline
    
    const submitInput = {
      userId: "user-001",
      teamId: "team-001",
      yesterdayAccomplishment: "タスクA完了",
      todayPlan: "タスクB実施",
      challenges: "リソース不足",
      reportDate: "2024-01-15"
    };

    // Mock the current time by creating a submission record with the test timestamp
    const submissionTimestamp = currentTime;

    // Act & Assert: Verify deadline exceeded error is thrown
    expect(() =>
      submitDailyReport(submitInput, submissionTimestamp, deadline)
    ).toThrow(/期限/);
  });
});