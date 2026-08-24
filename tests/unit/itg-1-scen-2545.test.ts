import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 初回テスト報告入力検証', () => {
  test('SCEN-2545: ユーザーとチームの関連付けが存在しない場合、報告送信が失敗する', async () => {
    const userIdNotAssociated = 'user_001';
    const teamIdNotAssociated = 'team_001';
    const reportDate = '2024-01-15';

    const submitDailyReportInput: SubmitDailyReportInput = {
      userId: userIdNotAssociated,
      teamId: teamIdNotAssociated,
      yesterdayAccomplishment: 'テスト報告のための実績を記載',
      todayPlan: 'テスト報告のための予定を記載',
      challenges: 'テスト報告のための課題を記載',
      reportDate: reportDate,
    };

    await expect(async () => {
      await submitDailyReport(submitDailyReportInput);
    }).rejects.toThrow(/所属/);
  });
});