import { submitDailyReport } from "../../src/logic/daily-report-management";
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from "../../src/logic/daily-report-management";

describe("Daily Report Submission with Deadline Judgment at Month Boundary", () => {
  test("SCEN-271: Delay judgment is accurate when deadline is set to 00:00:00 on the first day of the month", async () => {
    // Setup: Define the deadline as 2024-02-01T00:00:00Z (first day of month at 00:00:00)
    const deadlineTimestamp = new Date("2024-02-01T00:00:00.000Z");

    // Test Case 1: Submit at 2024-01-31T23:59:59Z (59 seconds before deadline)
    const beforeDeadlineTimestamp = new Date("2024-01-31T23:59:59.000Z");
    const beforeDeadlineInput: SubmitDailyReportInput = {
      userId: "user-001",
      teamId: "team-001",
      yesterdayAccomplishment: "Completed project setup and initial configuration",
      todayPlan: "Begin core feature development",
      challenges: "Dependency resolution for build system",
      reportDate: "2024-01-31",
    };

    const mockNotificationServiceAdapterBefore = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: "success" }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    // Mock current time to before deadline
    const originalDateNow = Date.now;
    global.Date.now = jest.fn(() => beforeDeadlineTimestamp.getTime());

    const beforeDeadlineResult = await submitDailyReport(
      beforeDeadlineInput,
      mockNotificationServiceAdapterBefore,
      deadlineTimestamp
    );

    expect(beforeDeadlineResult.isWithinDeadline).toBe(true);
    expect(beforeDeadlineResult.submissionTimestamp).toBeDefined();
    
    // Verify that the submission was recorded as on-time
    const beforeDeadlineDate = new Date(beforeDeadlineResult.submissionTimestamp);
    expect(beforeDeadlineDate.getTime()).toBeLessThan(deadlineTimestamp.getTime());

    // Test Case 2: Submit at 2024-02-01T00:00:01Z (1 second after deadline)
    const afterDeadlineTimestamp = new Date("2024-02-01T00:00:01.000Z");
    const afterDeadlineInput: SubmitDailyReportInput = {
      userId: "user-001",
      teamId: "team-001",
      yesterdayAccomplishment: "Continued feature development and testing",
      todayPlan: "Complete API integration",
      challenges: "Performance optimization needed",
      reportDate: "2024-02-01",
    };

    const mockNotificationServiceAdapterAfter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: "success" }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    // Mock current time to after deadline
    global.Date.now = jest.fn(() => afterDeadlineTimestamp.getTime());

    const afterDeadlineResult = await submitDailyReport(
      afterDeadlineInput,
      mockNotificationServiceAdapterAfter,
      deadlineTimestamp
    );

    expect(afterDeadlineResult.isWithinDeadline).toBe(false);
    expect(afterDeadlineResult.submissionTimestamp).toBeDefined();

    // Verify that the submission was recorded as delayed
    const afterDeadlineDate = new Date(afterDeadlineResult.submissionTimestamp);
    expect(afterDeadlineDate.getTime()).toBeGreaterThan(deadlineTimestamp.getTime());

    // Test Case 3: Submit exactly at 2024-02-01T00:00:00Z (boundary condition - inclusive)
    const exactDeadlineTimestamp = new Date("2024-02-01T00:00:00.000Z");
    const exactDeadlineInput: SubmitDailyReportInput = {
      userId: "user-002",
      teamId: "team-001",
      yesterdayAccomplishment: "Completed testing phase",
      todayPlan: "Deployment preparation",
      challenges: "Database migration timing",
      reportDate: "2024-02-01",
    };

    const mockNotificationServiceAdapterExact = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: "success" }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    // Mock current time to exactly the deadline
    global.Date.now = jest.fn(() => exactDeadlineTimestamp.getTime());

    const exactDeadlineResult = await submitDailyReport(
      exactDeadlineInput,
      mockNotificationServiceAdapterExact,
      deadlineTimestamp
    );

    // Boundary condition: submission at exact deadline moment should be considered on-time
    expect(exactDeadlineResult.isWithinDeadline).toBe(true);
    expect(exactDeadlineResult.submissionTimestamp).toBeDefined();

    const exactDeadlineDate = new Date(exactDeadlineResult.submissionTimestamp);
    expect(exactDeadlineDate.getTime()).toBeLessThanOrEqual(deadlineTimestamp.getTime());

    // Restore original Date.now
    global.Date.now = originalDateNow;

    // Verify all reportIds are generated uniquely
    expect(beforeDeadlineResult.reportId).toBeDefined();
    expect(afterDeadlineResult.reportId).toBeDefined();
    expect(exactDeadlineResult.reportId).toBeDefined();
    expect(beforeDeadlineResult.reportId).not.toEqual(afterDeadlineResult.reportId);
    expect(afterDeadlineResult.reportId).not.toEqual(exactDeadlineResult.reportId);
  });
});