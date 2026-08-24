import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit Daily Report', () => {
  // SCEN-2540: [edge] 初回テスト報告の入力検証機能 - ユーザー ID が無効な値である場合、ユーザー参照検証が不合格となる
  test('should reject submission when user ID is invalid and return USER_NOT_FOUND error without calling notification service', async () => {
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ success: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const invalidUserIds = [null, '', '-1', '99999'];
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const yesterdayAccomplishment = 'Completed task A';
    const todayPlan = 'Plan task B';
    const challenges = 'Challenge C';

    for (const invalidUserId of invalidUserIds) {
      const input = {
        userId: invalidUserId as any,
        teamId,
        yesterdayAccomplishment,
        todayPlan,
        challenges,
        reportDate,
      };

      try {
        await submitDailyReport(input, notificationServiceAdapterStub);
        fail(`Should have thrown error for invalid userId: ${invalidUserId}`);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message || JSON.stringify(error)).toMatch(/USER_NOT_FOUND|ユーザー/i);
      }
    }

    expect(notificationServiceAdapterStub.sendReminderNotification).not.toHaveBeenCalled();
    expect(notificationServiceAdapterStub.scheduleNotification).not.toHaveBeenCalled();
  });
});