import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2647: [error] 初回テスト報告入力検証機能 - 報告入力時刻が定められた報告期限を超過しているとき不合格判定となる
  test('報告入力時刻が報告期限を超過している場合、エラーステータスが返却され、データは保存されない', () => {
    const currentTimestamp = new Date('2024-01-15T09:01:00Z'); // 期限超過時刻: 09:01
    const reportDeadline = '09:00'; // 報告期限: 09:00
    
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'テスト値: 昨日の実績',
      todayPlan: 'テスト値: 今日の予定',
      challenges: 'テスト値: 課題記述',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input, currentTimestamp, reportDeadline);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(/報告期限/);
    expect(result.reportId).toBeUndefined();
  });
});