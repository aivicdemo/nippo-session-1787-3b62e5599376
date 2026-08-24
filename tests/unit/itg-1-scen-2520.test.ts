import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2520
  test('[error] 初回テスト報告の入力検証 - 報告者IDが0のとき入力検証エラーが返される', async () => {
    const invalidInput = {
      userId: '0',
      teamId: 'team-001',
      yesterdayAccomplishment: 'テスト',
      todayPlan: 'テスト',
      challenges: 'テスト',
      reportDate: '2024-01-15',
    };

    const error = await expect(
      submitDailyReport(invalidInput)
    ).rejects.toMatchObject({
      errorCode: 'INVALID_REPORTER_ID',
      message: '報告者IDは1以上である必要があります',
      field: 'userId',
      rejectedValue: '0',
      statusCode: 400,
    });

    expect(error).toBeDefined();
  });
});