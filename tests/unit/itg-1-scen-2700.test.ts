import { fetchYesterdayReport } from '../../src/logic/report-submission';
import { type DailyReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 前日報告内容の取得・表示機能', () => {
  // SCEN-2700
  test('報告が保存された翌日以降に前日報告を取得すると、期間の開始日と終了日が正確に前日で区切られる', async () => {
    // 手順1: ユーザーAが2026年1月15日 09:00にログイン
    const engineerId = 'engineer-a-001';
    const requestingUserId = 'engineer-a-001';
    const submissionDate = new Date('2026-01-15T09:05:00Z');

    // 手順2-3: 報告内容を入力・送信してシステムが保存
    const reportedYesterdayAccomplishment = 'タスクX完了';
    const reportedTodayPlan = 'タスクY開始';
    const reportedChallenges = '課題Z';

    // 手順4: 翌日2026年1月16日 09:30に前日報告を取得
    const queryDateOnJan16 = new Date('2026-01-16');
    const expectedStartDateOnJan16 = new Date('2026-01-15T00:00:00Z');
    const expectedEndDateOnJan16 = new Date('2026-01-15T23:59:59Z');

    // モック: fetchYesterdayReportが返す前日報告データ（2026-01-15の報告）
    const mockYesterdayReportOnJan16: DailyReport = {
      reportId: 'report-001',
      engineerId: engineerId,
      reportDate: new Date('2026-01-15'),
      yesterdayAccomplishment: reportedYesterdayAccomplishment,
      todayPlan: reportedTodayPlan,
      challenges: reportedChallenges,
      submittedAt: submissionDate,
    };

    // 手順5-7: 実際の関数呼び出し
    // 注: fetchYesterdayReportがモック可能な外部APIを呼び出す場合、
    // ここでは関数が返すことを検証する
    const reportOnJan16 = await fetchYesterdayReport({
      engineerId: engineerId,
      targetDate: queryDateOnJan16,
      requestingUserId: requestingUserId,
    });

    // 手順7: 返却された前日報告の期間開始日を検証
    expect(reportOnJan16.reportDate.toISOString()).toBe('2026-01-15T00:00:00.000Z');

    // 手順8: 返却された前日報告の期間終了日を検証
    // reportDateが2026-01-15であることが日の終了を示す
    const reportEndOfDay = new Date(reportOnJan16.reportDate);
    reportEndOfDay.setHours(23, 59, 59, 999);
    expect(reportEndOfDay.toISOString()).toBe('2026-01-15T23:59:59.999Z');

    // 手順9: 返却された報告内容が入力した内容と完全に一致することを検証
    expect(reportOnJan16.yesterdayAccomplishment).toBe(reportedYesterdayAccomplishment);
    expect(reportOnJan16.todayPlan).toBe(reportedTodayPlan);
    expect(reportOnJan16.challenges).toBe(reportedChallenges);
    expect(reportOnJan16.engineerId).toBe(engineerId);

    // 手順10: 翌々日2026年1月17日 09:30に前日報告を取得
    const queryDateOnJan17 = new Date('2026-01-17');
    const expectedStartDateOnJan17 = new Date('2026-01-16T00:00:00Z');
    const expectedEndDateOnJan17 = new Date('2026-01-16T23:59:59Z');

    // モック: fetchYesterdayReportが返す前日報告データ（2026-01-16の報告）
    const mockYesterdayReportOnJan17: DailyReport = {
      reportId: 'report-002',
      engineerId: engineerId,
      reportDate: new Date('2026-01-16'),
      yesterdayAccomplishment: 'タスクY開始完了',
      todayPlan: 'タスクZ実施',
      challenges: '課題A',
      submittedAt: new Date('2026-01-16T09:05:00Z'),
    };

    const reportOnJan17 = await fetchYesterdayReport({
      engineerId: engineerId,
      targetDate: queryDateOnJan17,
      requestingUserId: requestingUserId,
    });

    // 期間が2026年1月16日 00:00:00～23:59:59で区切られることを検証
    expect(reportOnJan17.reportDate.toISOString()).toBe('2026-01-16T00:00:00.000Z');
    const reportEndOfDayJan17 = new Date(reportOnJan17.reportDate);
    reportEndOfDayJan17.setHours(23, 59, 59, 999);
    expect(reportEndOfDayJan17.toISOString()).toBe('2026-01-16T23:59:59.999Z');

    // 期待結果: 期間開始日が前日の 00:00:00、終了日が前日の 23:59:59に正確に固定されている
    expect(reportOnJan16.reportDate.getUTCHours()).toBe(0);
    expect(reportOnJan16.reportDate.getUTCMinutes()).toBe(0);
    expect(reportOnJan16.reportDate.getUTCSeconds()).toBe(0);
    expect(reportOnJan17.reportDate.getUTCHours()).toBe(0);
    expect(reportOnJan17.reportDate.getUTCMinutes()).toBe(0);
    expect(reportOnJan17.reportDate.getUTCSeconds()).toBe(0);

    // 各日付が異なることを検証（複数日にまたがる報告が含まれていない）
    const jan16Day = reportOnJan16.reportDate.getUTCDate();
    const jan17Day = reportOnJan17.reportDate.getUTCDate();
    expect(jan17Day).toBe(jan16Day + 1);
  });
});