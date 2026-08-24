import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2496
  test('操作習熟度スコアがちょうど70点のとき合格判定される', () => {
    const userId = 'user_a_001';
    const teamId = 'team_001';
    const reportDate = '2024-01-15';

    // ユーザーAが6回の日報送信を実行して習熟度スコア計算用のデータを満たす
    const submitOperations: SubmitDailyReportInput[] = [
      {
        userId,
        teamId,
        yesterdayAccomplishment: '前日のタスク1を完了した',
        todayPlan: '本日のタスク1を実行予定',
        challenges: '課題1に対応中',
        reportDate,
      },
      {
        userId,
        teamId,
        yesterdayAccomplishment: '前日のタスク2を完了した',
        todayPlan: '本日のタスク2を実行予定',
        challenges: '課題2に対応中',
        reportDate,
      },
      {
        userId,
        teamId,
        yesterdayAccomplishment: '前日のタスク3を完了した',
        todayPlan: '本日のタスク3を実行予定',
        challenges: '課題3に対応中',
        reportDate,
      },
      {
        userId,
        teamId,
        yesterdayAccomplishment: '前日のタスク4を完了した',
        todayPlan: '本日のタスク4を実行予定',
        challenges: '課題4に対応中',
        reportDate,
      },
      {
        userId,
        teamId,
        yesterdayAccomplishment: '前日のタスク5を完了した',
        todayPlan: '本日のタスク5を実行予定',
        challenges: '課題5に対応中',
        reportDate,
      },
      {
        userId,
        teamId,
        yesterdayAccomplishment: '前日のタスク6を完了した',
        todayPlan: '本日のタスク6を実行予定',
        challenges: '課題6に対応中',
        reportDate,
      },
    ];

    let latestResult: SubmitDailyReportOutput | null = null;

    // 6回の操作を実行してスコア計算用のデータを蓄積
    for (const operation of submitOperations) {
      latestResult = submitDailyReport(operation);
      expect(latestResult).toBeDefined();
      expect(latestResult.reportId).toBeDefined();
      expect(typeof latestResult.reportId).toBe('string');
      expect(latestResult.submissionTimestamp).toBeDefined();
      expect(typeof latestResult.isWithinDeadline).toBe('boolean');
    }

    // 最終的な習熟度スコアが70点であることを検証
    expect(latestResult).not.toBeNull();
    if (latestResult) {
      expect(latestResult.proficiencyScore).toBe(70);
      expect(latestResult.proficiencyStatus).toBe('pass');
    }
  });
});