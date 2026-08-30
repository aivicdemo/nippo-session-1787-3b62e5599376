import { submitReport } from '../../src/logic/report-submission-management';
import { type SubmitReportInput, type SubmitReportOutput } from '../../src/logic/report-submission-management';

describe('Report Submission Management', () => {
  // SCEN-302: [normal] エンジニアが日報を送信し、入力検証、送信時刻記録、期限判定、提出状況更新を実行する
  test('submitReport records submission timestamp and validates deadline correctly', () => {
    const reporterId = 'ENG001';
    const teamId = 'TEAM-A';
    const reportDate = new Date('2026-08-19T00:00:00Z');
    const yesterdayAccomplishment = '昨日のタスク完了';
    const todayPlan = '本日の予定内容';
    const issuesAndConcerns = '現在の課題事項';
    const systemRecordedTimestamp = new Date('2026-08-19T09:15:30.000Z');
    const expectedReportId = 'RPT-20260819-001';

    const input: SubmitReportInput = {
      reporterId,
      teamId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      issuesAndConcerns,
    };

    const result: SubmitReportOutput = submitReport(input);

    expect(result.reportId).toBe(expectedReportId);
    expect(result.submissionStatus).toBe('submitted');
    expect(result.submissionTimestamp).toEqual(systemRecordedTimestamp);
    expect(result.isWithinDeadline).toBe(true);
    expect(result.remainingTimeToDeadline).toBeGreaterThanOrEqual(0);
  });
});