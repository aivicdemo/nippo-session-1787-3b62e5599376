import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Reminder Notification and Deadline Tracking', () => {
  // SCEN-063: [normal] 日報送信タイムスタンプ記録と期限判定機能 - 記録されたタイムスタンプが朝会開始時刻より前の場合、期限内判定が true を返す
  test('should record submission timestamp and return isWithinDeadline as true when submitted before morning meeting start time', () => {
    const userId = 'user-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const yesterdayAccomplishment = 'Completed feature development for login module';
    const todayPlan = 'Testing and code review for authentication feature';
    const challenges = 'Need to resolve database connection timeout issue';
    
    const submissionTimestamp = new Date('2024-01-15T08:55:30Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');

    const input = {
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
    };

    const result = submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    
    const parsedSubmissionTime = new Date(result.submissionTimestamp);
    expect(parsedSubmissionTime.getTime()).toBeLessThanOrEqual(
      submissionTimestamp.getTime() + 1000
    );
    
    expect(result.isWithinDeadline).toBe(true);
    
    const submittedTimeMs = parsedSubmissionTime.getTime();
    const deadlineTimeMs = morningMeetingStartTime.getTime();
    expect(submittedTimeMs).toBeLessThan(deadlineTimeMs);
  });
});