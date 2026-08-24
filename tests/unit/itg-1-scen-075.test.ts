import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit Daily Report', () => {
  test('SCEN-075: should reject submission when time is before morning meeting start time', () => {
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submissionTimestamp = new Date('2024-01-15T08:59:59Z');

    const input = {
      reportId: 'report-001',
      userId: 'user-001',
      submissionTimestamp: submissionTimestamp,
      reportContent: {
        yesterdayAccomplishment: 'Completed feature implementation',
        todayPlan: 'Code review and testing',
        challenges: 'Database connection timeout'
      }
    };

    expect(() => {
      submitDailyReport(input, morningMeetingStartTime);
    }).toThrow(/期限/);
  });
});