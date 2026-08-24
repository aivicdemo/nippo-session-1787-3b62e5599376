import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('detectAndNotifyUnsubmittedMembers - 段階的通知方法の遷移ルールが未定義の場合', () => {
  let mockNotificationServiceAdapter: any;
  let mockTransitionRuleRepository: any;
  let mockUnsubmittedMembersRepository: any;
  let mockAlertLogRepository: any;

  beforeEach(() => {
    mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    mockTransitionRuleRepository = {
      findByCurrentLevel: jest.fn().mockResolvedValue(null),
    };

    mockUnsubmittedMembersRepository = {
      findUnsubmittedByTeamAndDate: jest.fn(),
    };

    mockAlertLogRepository = {
      insert: jest.fn().mockResolvedValue({ id: 'alert-001' }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2867
  test('段階的通知方法の遷移ルールマスタが空の場合、催促通知が実行されずエラーログが記録される', async () => {
    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'admin-001',
    };

    const unsubmittedMembersData = [
      {
        userId: 'member-A',
        userName: 'Taro Yamada',
        email: 'taro@example.com',
        remainingMinutes: -30,
        notificationLevel: 1,
      },
    ];

    mockUnsubmittedMembersRepository.findUnsubmittedByTeamAndDate.mockResolvedValue(
      unsubmittedMembersData
    );

    mockTransitionRuleRepository.findByCurrentLevel.mockResolvedValue(null);

    let caughtError: Error | null = null;
    let result: DetectUnsubmittedMembersOutput | null = null;

    try {
      result = await detectAndNotifyUnsubmittedMembers(
        input,
        mockNotificationServiceAdapter,
        mockTransitionRuleRepository,
        mockUnsubmittedMembersRepository,
        mockAlertLogRepository
      );
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/遷移ルール/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

    expect(mockTransitionRuleRepository.findByCurrentLevel).toHaveBeenCalledWith(1);

    expect(mockAlertLogRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        message: expect.stringMatching(/段階的通知ルール設定が不完全/),
        teamId: 'team-001',
        reportDate: '2024-01-15',
        executedAt: expect.any(String),
      })
    );

    if (result) {
      expect(result.notificationsSent).toBe(0);
      expect(result.notificationFailures).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: 'member-A',
            failureReason: expect.stringMatching(/遷移ルール/),
          }),
        ])
      );
    }
  });
});