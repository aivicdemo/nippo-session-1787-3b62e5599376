import { describe, test, expect, beforeEach } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2656
  test('同一ユーザーによる重複報告入力のとき不合格判定となる', async () => {
    const userId = 'user-a-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const yesterdayAccomplishment = 'タスクX完了';
    const todayPlan = 'タスクY開始';
    const challenges = '問題Z';

    const firstReportInput: SubmitDailyReportInput = {
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
    };

    const firstSubmissionResult = await submitDailyReport(firstReportInput);
    expect(firstSubmissionResult.reportId).toBeDefined();
    expect(typeof firstSubmissionResult.reportId).toBe('string');
    expect(firstSubmissionResult.submissionTimestamp).toBeDefined();
    expect(firstSubmissionResult.isWithinDeadline).toBe(true);

    const secondReportInput: SubmitDailyReportInput = {
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
    };

    expect(() => submitDailyReport(secondReportInput)).reThrow(/重複報告/);
  });
});