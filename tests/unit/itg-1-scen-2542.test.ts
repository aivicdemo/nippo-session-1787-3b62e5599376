import { describe, test, expect, beforeEach } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - submitDailyReport', () => {
  // SCEN-2542: [edge] 初回テスト報告の入力検証機能 - チーム ID が無効な値である場合、チーム参照検証が不合格となる
  test('should reject submission when teamId is invalid and not call external service', async () => {
    // Mock NotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // Test cases with invalid teamId values
    const invalidTeamIds = ['', null, undefined, '-1', '99999'];

    for (const invalidTeamId of invalidTeamIds) {
      const input: SubmitDailyReportInput = {
        userId: 'user-001',
        teamId: invalidTeamId as any,
        yesterdayAccomplishment: 'Completed API development',
        todayPlan: 'Code review and testing',
        challenges: 'Database performance issues',
        reportDate: '2024-01-15',
      };

      // Execute submitDailyReport with invalid teamId
      let thrownError: Error | null = null;
      try {
        await submitDailyReport(input, mockNotificationAdapter);
      } catch (error) {
        thrownError = error as Error;
      }

      // Verify that validation error is thrown with correct error code
      expect(thrownError).not.toBeNull();
      expect(thrownError?.message).toMatch(/INVALID_TEAM_ID/);
      expect(thrownError?.message).toMatch(/チーム ID が無効です/);

      // Verify that external service was never called
      expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
      expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
      expect(mockNotificationAdapter.getDeliveryStatus).not.toHaveBeenCalled();

      // Reset mocks for next iteration
      jest.clearAllMocks();
    }
  });
});