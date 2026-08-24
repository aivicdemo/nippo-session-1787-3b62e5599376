import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking - detectAndNotifyUnsubmittedMembers', () => {
  // SCEN-2819
  test('should throw error when report deadline is before morning meeting start time', async () => {
    const morningMeetingStartTime = '09:00';
    const reportDeadlineTime = '08:30';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const executorUserId = 'user-manager-001';

    const notificationServiceAdapter = {
      sendReminderNotification: async () => ({
        sent: true,
        status: 'sent' as const,
      }),
    };

    expect(() =>
      detectAndNotifyUnsubmittedMembers(
        {
          teamId,
          reportDate,
          morningMeetingStartTime,
          executorUserId,
        },
        notificationServiceAdapter,
        {
          reportDeadlineTime,
          timeZone: 'Asia/Tokyo',
        }
      )
    ).toThrow(/報告期限は朝会開始予定時刻以降に設定/);
  });
});