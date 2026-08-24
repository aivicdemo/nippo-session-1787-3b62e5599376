import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput } from '../../src/logic/daily-report-management';

describe('submitDailyReport - NotificationServiceAdapter timeout handling', () => {
  test('SCEN-263: should throw TimeoutError and log failure when sendReminderNotification times out', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockRejectedValue(
        new Error('Notification service timeout')
      ),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockLogger = {
      recordNotificationFailure: jest.fn(),
    };

    const input: SubmitDailyReportInput = {
      userId: 'engineer-001',
      teamId: 'team-A',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Deploy to staging environment',
      challenges: 'Database connection pool issue',
      reportDate: '2024-01-15',
    };

    const mockSubmissionTimestamp = new Date('2024-01-15T08:45:00Z');

    expect(() =>
      submitDailyReport(input, mockNotificationServiceAdapter, mockLogger, mockSubmissionTimestamp)
    ).toThrow(/Notification service timeout/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
    expect(mockLogger.recordNotificationFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        errorReason: 'Notification service timeout',
        timestamp: mockSubmissionTimestamp,
      })
    );
  });
});