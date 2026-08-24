import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification - Report Deadline Display', () => {
  // SCEN-1111
  test('should calculate remaining time to report deadline accurately across month boundary', async () => {
    // Setup: Mock dates for three test points
    // Point 1: 2026-01-31 23:55 (Friday, 5 minutes before midnight)
    // Point 2: 2026-02-01 00:30 (Saturday, after midnight)
    // Point 3: 2026-02-01 08:59 (Saturday, 1 minute before deadline)
    
    const deadline = new Date('2026-02-01T09:00:00Z');
    
    // Point 1: 2026-01-31 23:55:00 UTC
    const point1Time = new Date('2026-01-31T23:55:00Z');
    const expectedRemainingPoint1 = 9 * 60 + 5; // 9 hours 5 minutes = 545 minutes
    
    // Point 2: 2026-02-01 00:30:00 UTC
    const point2Time = new Date('2026-02-01T00:30:00Z');
    const expectedRemainingPoint2 = 8 * 60 + 30; // 8 hours 30 minutes = 510 minutes
    
    // Point 3: 2026-02-01 08:59:00 UTC
    const point3Time = new Date('2026-02-01T08:59:00Z');
    const expectedRemainingPoint3 = 1; // 1 minute
    
    // Create mock NotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ sent: true, sentAt: new Date() }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };
    
    // Test Point 1: Month-end to month-initial boundary
    const input1: SendDailyReportReminderInput = {
      scheduledTime: point1Time,
      teamIds: ['team-001'],
      reportDeadlineTime: deadline,
      notificationChannels: ['email', 'in_app', 'slack'],
    };
    
    const result1 = await sendDailyReportReminder(input1, mockNotificationAdapter);
    
    expect(result1).toBeDefined();
    expect(result1.remainingTimeMinutes).toBe(expectedRemainingPoint1);
    expect(result1.remainingTimeMinutes).toBe(545);
    
    // Test Point 2: After midnight, deadline still ahead
    const input2: SendDailyReportReminderInput = {
      scheduledTime: point2Time,
      teamIds: ['team-001'],
      reportDeadlineTime: deadline,
      notificationChannels: ['email', 'in_app', 'slack'],
    };
    
    const result2 = await sendDailyReportReminder(input2, mockNotificationAdapter);
    
    expect(result2).toBeDefined();
    expect(result2.remainingTimeMinutes).toBe(expectedRemainingPoint2);
    expect(result2.remainingTimeMinutes).toBe(510);
    
    // Test Point 3: Close to deadline (1 minute remaining)
    const input3: SendDailyReportReminderInput = {
      scheduledTime: point3Time,
      teamIds: ['team-001'],
      reportDeadlineTime: deadline,
      notificationChannels: ['email', 'in_app', 'slack'],
    };
    
    const result3 = await sendDailyReportReminder(input3, mockNotificationAdapter);
    
    expect(result3).toBeDefined();
    expect(result3.remainingTimeMinutes).toBe(expectedRemainingPoint3);
    expect(result3.remainingTimeMinutes).toBe(1);
    
    // Verify month boundary calculation does not introduce errors
    const timeDifference1To2 = point2Time.getTime() - point1Time.getTime();
    const expectedMinutesDifference1To2 = (expectedRemainingPoint1 - expectedRemainingPoint2) * 60 * 1000;
    expect(timeDifference1To2).toBe(expectedMinutesDifference1To2);
    
    const timeDifference2To3 = point3Time.getTime() - point2Time.getTime();
    const expectedMinutesDifference2To3 = (expectedRemainingPoint2 - expectedRemainingPoint3) * 60 * 1000;
    expect(timeDifference2To3).toBe(expectedMinutesDifference2To3);
  });
});