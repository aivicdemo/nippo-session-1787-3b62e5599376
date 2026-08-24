import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Deadline Judgment', () => {
  test('SCEN-085: Month-end report submitted at exact meeting start time is judged as within deadline', async () => {
    // Setup: Mock current time to month-end (2024-01-31) at meeting start time (09:00:00 JST)
    const monthEndMeetingStartTime = new Date('2024-01-31T09:00:00+09:00');
    const mockCurrentTimestamp = new Date('2024-01-31T09:00:00+09:00');
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentTimestamp);

    // Mock NotificationServiceAdapter to prevent actual Slack/Teams API calls
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'sent',
        notificationId: 'notif-001',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'schedule-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'sent',
      }),
    };

    // Prepare test user data
    const testUserId = 'engineer-001';
    const testTeamId = 'team-alpha';
    const reportDate = '2024-01-31';

    // Input: Daily report data with all 3 required items
    const submitInput = {
      userId: testUserId,
      teamId: testTeamId,
      yesterdayAccomplishment:
        'Completed API authentication module implementation and unit tests',
      todayPlan:
        'Review API documentation, begin database schema design, conduct team sync meeting',
      challenges:
        'Database performance bottleneck identified during load testing; unclear optimal indexing strategy',
      reportDate: reportDate,
    };

    // Execute: Submit report at exact month-end meeting start time
    const result = await submitDailyReport(submitInput, mockNotificationAdapter, {
      morningMeetingStartTime: '09:00',
    });

    // Verify: Report is judged as within deadline
    expect(result.isWithinDeadline).toBe(true);
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);
    expect(result.submissionTimestamp).toBe('2024-01-31T09:00:00+09:00');

    // Verify: Notification adapter was called to queue confirmation email
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: testUserId,
        messageType: 'submission_confirmation',
      })
    );

    // Verify: User receives success confirmation message (implicit in result structure)
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('submissionTimestamp');
    expect(result).toHaveProperty('isWithinDeadline');

    jest.useRealTimers();
  });
});