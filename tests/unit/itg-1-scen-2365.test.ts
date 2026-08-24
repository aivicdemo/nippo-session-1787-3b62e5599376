import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 月次レポートデータ抽出', () => {
  test('SCEN-2365: 終了日が開始日より前の日付のとき処理がエラーになる', () => {
    const startDate = new Date('2026-01-15T00:00:00Z');
    const endDate = new Date('2026-01-10T23:59:59Z');
    const teamIds = ['team-001', 'team-002'];
    const reportRecords = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        submittedAt: new Date('2026-01-12T08:00:00Z'),
        yesterdayAccomplishments: 'テスト実施',
        todayPlan: 'バグ修正',
        challenges: 'DB接続タイムアウト',
      },
    ];

    expect(() =>
      extractMonthlyReportData({
        aggregationStartDate: startDate,
        aggregationEndDate: endDate,
        teamIds: teamIds,
        reportRecords: reportRecords,
      })
    ).toThrow(/終了日は開始日以降/);
  });
});