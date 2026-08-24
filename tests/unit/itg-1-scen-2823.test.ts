import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking: detectAndNotifyUnsubmittedMembers', () => {
  let adminAlertLogs: Array<{ timestamp: string; memberId: string; message: string }>;

  beforeEach(() => {
    adminAlertLogs = [];
    jest.spyOn(console, 'error').mockImplementation((msg: string) => {
      if (msg.includes('催促方法が判定不可')) {
        const match = msg.match(/メンバー:【([^】]+)】/);
        if (match) {
          adminAlertLogs.push({
            timestamp: new Date().toISOString(),
            memberId: match[1],
            message: msg,
          });
        }
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-2823: [error] 未提出メンバー優先度リスト取得 - 催促方法判定ロジックがnullを返すとき、エラーが発生する
  test('should throw error and log alert when reminder determination logic returns null', async () => {
    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'admin-user-001',
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockGetReminderMethodLogic = jest.fn().mockReturnValue(null);

    expect(() => {
      detectAndNotifyUnsubmittedMembers(
        input,
        mockNotificationServiceAdapter,
        mockGetReminderMethodLogic
      );
    }).toThrow(/催促方法が判定不可の状態を検出できません。メンバー:/);

    expect(adminAlertLogs.length).toBeGreaterThan(0);
    expect(adminAlertLogs[0].memberId).toBeDefined();
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});