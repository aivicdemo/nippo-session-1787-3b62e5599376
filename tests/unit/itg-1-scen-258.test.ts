import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('部長向けダッシュボード - 本日の報告提出状況のリアルタイム表示', () => {
  test('SCEN-258: 報告送信時刻の遅延判定機能 - 報告期限が不正な日時形式のとき、エラーが発生して処理が進まない', () => {
    const invalidDeadlineFormat = '2024-13-45 25:70:90';
    const submitInput = {
      userId: 'engineer-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Start database optimization',
      challenges: 'Performance bottleneck in query response time',
      reportDate: '2024-01-15',
    };

    expect(() =>
      submitDailyReport(submitInput, invalidDeadlineFormat)
    ).toThrow(/報告期限/);
  });
});