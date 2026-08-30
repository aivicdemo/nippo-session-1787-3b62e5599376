import { submitReport } from '../../src/logic/report-submission-management';
import { type SubmitReportInput, type SubmitReportOutput } from '../../src/logic/report-submission-management';

describe('submitReport - Morning Meeting Start Time Validation', () => {
  // SCEN-195: [error] エンジニアが日報を送信し、入力検証、送信時刻記録、期限判定、提出状況更新を実行する - 朝会開始時刻が不正な形式の場合
  test('should throw error when morning meeting start time is in invalid format', () => {
    const submissionTimestamp = new Date('2024-01-15T08:15:00Z');
    const morningMeetingStartTime = '25:99';
    const engineerId = 'ENG-001';
    const teamId = 'TEAM-001';
    const reportDate = new Date('2024-01-15');

    const submitReportInput: SubmitReportInput = {
      reporterId: engineerId,
      teamId: teamId,
      reportDate: reportDate,
      yesterdayAccomplishment: 'Completed feature A implementation',
      todayPlan: 'Start feature B development',
      issuesAndConcerns: 'Database connection timeout issue',
      submissionTimestamp: submissionTimestamp,
    };

    expect(() =>
      submitReport(submitReportInput, {
        reportSubmissionDeadline: new Date(`${reportDate.toISOString().split('T')[0]}T${morningMeetingStartTime}`),
        characterLimitPerField: 1000,
        minimumCharacterPerField: 1,
      })
    ).toThrow(/朝会開始時刻/);
  });
});