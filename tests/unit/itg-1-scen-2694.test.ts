import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('前日報告内容取得機能', () => {
  test('SCEN-2694: 抱えている課題が空文字のとき、エラーが発生する', async () => {
    const engineerId = 'user001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'manager001';

    const yesterdayReportInput = {
      engineerId,
      targetDate,
      requestingUserId,
    };

    const mockStoredReport = {
      reportId: 'report-001',
      engineerId: 'user001',
      reportDate: new Date('2024-01-14'),
      yesterdayAccomplishment: '昨日やったこと',
      todayPlan: '今日やること',
      challenges: '',
      submittedAt: new Date('2024-01-14T09:00:00Z'),
    };

    try {
      await fetchYesterdayReport(yesterdayReportInput);
      fail('エラーが発生していない');
    } catch (error) {
      expect(error).toEqual(
        expect.objectContaining({
          errorCode: 'INVALID_INPUT',
          message: expect.stringMatching(/課題/),
        })
      );
    }
  });
});