import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバーの検出と通知', () => {
  // SCEN-2814: [normal] 手動トリガー実行機能 - プロジェクトマネージャーが手動で未提出確認を実行したとき、未提出メンバーリストが即座に返される
  test('手動トリガーで未提出メンバーを3秒以内に検出・返却する', async () => {
    const testStartTime = Date.now();

    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'pm-user-001'
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T08:30:00Z')
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue([])
    };

    const result: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationServiceAdapter
    );

    const testEndTime = Date.now();
    const elapsedMillis = testEndTime - testStartTime;

    expect(elapsedMillis).toBeLessThanOrEqual(3000);

    expect(result).toBeDefined();
    expect(result.unsubmittedMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: expect.any(String),
          userName: expect.any(String),
          email: expect.any(String),
          remainingMinutes: expect.any(Number)
        })
      ])
    );

    expect(result.notificationsSent).toBeGreaterThanOrEqual(0);
    expect(result.notificationFailures).toEqual(expect.any(Array));
    expect(result.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});