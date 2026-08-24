import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2527: [error] 初回テスト報告の入力検証 - テスト実施内容が不適切な言語や記号のみで構成されるとき入力検証エラーが返される
  test('不適切な言語や記号のみで構成されたテキストを入力した場合、入力検証エラーが返される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'test-user-001',
      teamId: 'team-dev-001',
      yesterdayAccomplishment: '昨日は単体テストを実装しました。テスト件数は50件です。',
      todayPlan: '本日はAPIの実装とテストを行う予定です。',
      challenges: '!@#$%^&*()',
      reportDate: '2024-01-15',
    };

    try {
      await submitDailyReport(input);
      fail('検証エラーが発生すると期待されます');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/有効な文字列/);
    }
  });
});