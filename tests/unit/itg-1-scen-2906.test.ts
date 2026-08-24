import { aggregateReportSubmissionStatus, type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('提出状況集計機能', () => {
  // SCEN-2906
  test('朝会開始時刻が朝会開始予定時刻より前のときエラーが発生する', () => {
    const morningMeetingStartTime = '09:00:00';
    const currentTime = new Date('2024-01-15T08:59:59Z');
    
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
      morningMeetingStartTime: morningMeetingStartTime,
      currentTime: currentTime,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/朝会開始時刻は朝会開始予定時刻以降である必要があります/);
  });
});