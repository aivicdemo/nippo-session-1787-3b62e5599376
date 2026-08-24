import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking: detectAndNotifyUnsubmittedMembers', () => {
  // SCEN-2824: [error] 未提出メンバー優先度リスト取得 - ユーザーIDが空文字列のメンバーが含まれるとき、エラーが発生する
  test('should throw ValidationError when member has empty userId', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'user-admin-001';

    const unsubmittedMembersWithEmptyUserId = [
      {
        userId: '',
        userName: 'テストユーザー',
        email: 'test@example.com',
        remainingMinutes: -30
      }
    ];

    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' })
    };

    const textAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([])
    };

    await expect(
      detectAndNotifyUnsubmittedMembers(
        {
          teamId,
          reportDate,
          morningMeetingStartTime,
          executorUserId
        },
        unsubmittedMembersWithEmptyUserId,
        notificationServiceAdapter,
        textAnalysisAdapter
      )
    ).rejects.toThrow(/ユーザーID/);
  });
});