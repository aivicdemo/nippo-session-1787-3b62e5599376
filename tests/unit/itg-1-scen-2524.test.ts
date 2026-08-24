import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  // SCEN-2524: [error] 初回テスト報告の入力検証 - 報告者IDが存在しないユーザーIDのとき入力検証エラーが返される
  test('should return validation error when reporter ID does not exist in user management table', async () => {
    const input = {
      userId: 'USER_99999',
      teamId: 'TEAM_001',
      yesterdayAccomplishment: 'Completed API implementation',
      todayPlan: 'Review pull requests',
      challenges: 'Database performance issues',
      reportDate: '2024-01-15',
    };

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({ keywords: [], frequency: [] }),
      assessImpactScore: jest.fn().mockResolvedValue({ score: 0 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'low' }),
    };

    const error = await submitDailyReport(input, notificationServiceAdapterStub, textAnalysisServiceAdapterStub).catch(
      (err) => err,
    );

    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe('INVALID_REPORTER_ID');
    expect(error.message).toMatch(/報告者ID/);
    expect(error.field).toBe('userId');
    expect(error.invalidValue).toBe('USER_99999');
  });
});