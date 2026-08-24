import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('週次日報データ集約機能 - 昨日やったこと項目の入力値検証', () => {
  // SCEN-1454
  test('昨日やったこと項目が空文字列の場合にエラーが発生する', () => {
    const request: WeeklyExtractionRequest = {
      weekStartDate: new Date('2024-01-08T00:00:00Z'),
      weekEndDate: new Date('2024-01-14T23:59:59Z'),
      teamIds: ['team-001'],
      requestedByUserId: 'user-manager-001',
    };

    const invalidReportData = {
      reportDate: new Date('2024-01-08T09:00:00Z'),
      reporterId: 'user-engineer-001',
      yesterdayAccomplishment: '',
      todayPlan: 'テスト自動化スクリプトの作成',
      challenges: '外部API の遅延問題が続いている',
    };

    expect(() =>
      extractWeeklyReportData(request, [invalidReportData])
    ).toThrow(/昨日やったこと/);
  });
});