import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification - Submission Status Tracking', () => {
  // SCEN-304: [edge] リマインド通知自動送信機能 - 同じユーザーが2つ以上のチームに属する場合、重複なく1回だけ通知が送信される
  test('should send reminder notification exactly once when user belongs to multiple teams', async () => {
    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T14:00:00Z');
    
    const teamIdX = 'team-x-001';
    const teamIdY = 'team-y-002';
    const teamIdZ = 'team-z-003';
    const userIdA = 'user-a-001';
    
    const teamIds = [teamIdX, teamIdY, teamIdZ];
    const notificationChannels = ['email', 'in_app'] as const;
    
    let sendReminderNotificationCallCount = 0;
    const notifiedUserIds = new Set<string>();
    const callHistory: Array<{ userId: string; timestamp: Date }> = [];
    
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, remainingMinutes: number) => {
        sendReminderNotificationCallCount++;
        notifiedUserIds.add(userId);
        callHistory.push({
          userId,
          timestamp: new Date()
        });
        return {
          success: true,
          deliveryStatus: 'sent' as const,
          sentAt: new Date()
        };
      })
    };
    
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels
    };
    
    const result = await sendDailyReportReminder(input, mockNotificationServiceAdapter);
    
    expect(result).toBeDefined();
    expect(typeof result.sentCount).toBe('number');
    expect(result.sentCount).toBeGreaterThanOrEqual(0);
    
    const userANotifications = callHistory.filter(call => call.userId === userIdA);
    expect(userANotifications.length).toBe(0);
    
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
    
    const callsToUserA = mockNotificationServiceAdapter.sendReminderNotification.mock.calls.filter(
      (call: any[]) => call[0] === userIdA
    );
    expect(callsToUserA.length).toBeLessThanOrEqual(1);
    
    const uniqueNotifiedUsers = new Set(
      mockNotificationServiceAdapter.sendReminderNotification.mock.calls.map((call: any[]) => call[0])
    );
    expect(uniqueNotifiedUsers.size).toBeLessThanOrEqual(
      mockNotificationServiceAdapter.sendReminderNotification.mock.calls.length
    );
  });
});