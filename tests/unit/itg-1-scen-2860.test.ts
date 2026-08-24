import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput, NotificationServiceAdapter } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能 - 再催促レベル検証', () => {
  let mockNotificationAdapter: NotificationServiceAdapter;

  beforeEach(() => {
    mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T09:00:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2860
  test('再催促レベルが定義範囲外（負数、100以上）のとき、通知方法の選択に失敗する', async () => {
    const baseInput: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-manager-001',
    };

    // ケース1: 再催促レベルが負数（-1）の場合
    const negativeRetryLevelInput = {
      ...baseInput,
      retryLevel: -1,
    };

    try {
      await detectAndNotifyUnsubmittedMembers(
        negativeRetryLevelInput,
        mockNotificationAdapter
      );
      fail('負数の再催促レベルでエラーが発生するはず');
    } catch (error) {
      expect((error as Error).message).toMatch(/再催促レベル/);
      expect((error as Error).message).toMatch(/0～99/);
    }

    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();

    // ケース2: 再催促レベルが100以上（150）の場合
    const highRetryLevelInput = {
      ...baseInput,
      retryLevel: 150,
    };

    try {
      await detectAndNotifyUnsubmittedMembers(
        highRetryLevelInput,
        mockNotificationAdapter
      );
      fail('100以上の再催促レベルでエラーが発生するはず');
    } catch (error) {
      expect((error as Error).message).toMatch(/再催促レベル/);
      expect((error as Error).message).toMatch(/0～99/);
    }

    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});