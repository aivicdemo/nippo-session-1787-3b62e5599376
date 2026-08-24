import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Year-End Edge Case', () => {
  // SCEN-084: [edge] 日報送信期限判定機能 - 日報送信が年をまたぐ場合（12月31日23時59分59秒送信）に期限判定が正しく実行される
  test('should correctly handle deadline judgment when submission occurs at year boundary (2024-12-31T23:59:59Z)', () => {
    // Arrange
    const submissionTimestamp = new Date('2024-12-31T23:59:59Z');
    const reportDate = '2024-12-31';
    const userId = 'test-user-001';
    const teamId = 'team-001';

    const submitDailyReportInput = {
      userId: userId,
      teamId: teamId,
      yesterdayAccomplishment: 'Completed project documentation and code review process',
      todayPlan: 'Continue implementation of pending features and team meeting preparation',
      challenges: 'Database performance issues identified during load testing phase',
      reportDate: reportDate,
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 200,
        notificationId: 'notif-001',
        deliveredAt: submissionTimestamp.toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    // Mock current time to year-end boundary
    jest.useFakeTimers();
    jest.setSystemTime(submissionTimestamp);

    // Act
    const result = submitDailyReport(
      submitDailyReportInput,
      mockNotificationServiceAdapter
    );

    // Assert
    expect(result).toHaveProperty('reportId');
    expect(result.reportId).toMatch(/^[a-zA-Z0-9-]+$/);
    
    expect(result.submissionTimestamp).toBe('2024-12-31T23:59:59Z');
    
    // Year-end submission should be within deadline (assuming same-day deadline)
    expect(result.isWithinDeadline).toBe(true);
    
    // Verify that the submission timestamp is recorded correctly without rollover issues
    expect(result.submissionTimestamp).not.toContain('2025-01-01');
    
    // Verify notification adapter was called
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});