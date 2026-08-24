import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Timestamp Recording and Deadline Judgment', () => {
  // SCEN-065: [normal] 日報送信タイムスタンプ記録と期限判定機能 - 記録されたタイムスタンプが朝会開始時刻より後の場合、期限内判定が false を返す
  test('should record submission timestamp and return isWithinDeadline as false when submitted after morning meeting start time', () => {
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submissionTimestamp = new Date('2024-01-15T09:00:01Z');
    
    const input = {
      reportId: 'report-001',
      userId: 'user-123',
      submissionTimestamp: submissionTimestamp,
      reportContent: {
        yesterdayAccomplishment: 'Completed feature A development',
        todayPlan: 'Start feature B testing',
        challenges: 'Database performance issue affecting deployment'
      }
    };
    
    const result = submitDailyReport(
      input,
      morningMeetingStartTime
    );
    
    expect(result.submissionTimestamp).toEqual(submissionTimestamp);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.deadlineComparisonResult.status).toBe('delayed');
    expect(result.deadlineComparisonResult.minutesBeforeDeadline).toBe(-1);
  });
});