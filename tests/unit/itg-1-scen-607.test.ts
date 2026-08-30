import { saveReport } from '../../src/logic/report-persistence';
import { type SaveReportInput } from '../../src/logic/report-persistence';

describe('朝会報告管理システム - 日報永続化', () => {
  // SCEN-607
  test('reporterId が空文字列の場合、InvalidReportDataError をスロー', async () => {
    const invalidInput: SaveReportInput = {
      reporterId: '',
      teamId: 'team-001',
      reportDate: new Date('2024-01-15T09:00:00Z'),
      yesterdayAccomplishment: '前日の実績',
      todayPlan: '本日の予定',
      issuesAndConcerns: '課題内容',
    };

    await expect(() => saveReport(invalidInput)).rejects.toThrow(/ユーザー認証/);
  });
});