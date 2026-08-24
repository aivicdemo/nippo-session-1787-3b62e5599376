import { describe, test, expect, beforeEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能', () => {
  // SCEN-2853: [error] 未提出メンバー催促通知機能 - 未提出メンバーリストがnullのとき、エラーが発生する
  test('未提出メンバーリストがnullの場合、エラーをスロー', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        unsubmittedMembers: null,
        notificationsSent: 0,
        notificationFailures: []
      })
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-manager-001'
    };

    expect(async () => {
      await detectAndNotifyUnsubmittedMembers(input, mockNotificationServiceAdapter);
    }).rejects.toThrow(/メンバーリスト|null/);
  });
});