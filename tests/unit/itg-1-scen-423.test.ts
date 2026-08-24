import { aggregateReportSubmissionStatus, type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking', () => {
  // SCEN-423
  test('should mark member as unsubmitted when aggregation time exceeds deadline by 1 second, despite timely submission', () => {
    const deadlineTime = new Date('2024-01-15T09:00:00Z');
    const submissionTime = new Date('2024-01-15T08:59:59Z');
    const aggregationTime = new Date('2024-01-15T09:00:01Z');

    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const memberA = {
      userId: 'user-001',
      userName: 'Member A',
      email: 'member-a@example.com',
      submissionTime: submissionTime,
    };

    const memberB = {
      userId: 'user-002',
      userName: 'Member B',
      email: 'member-b@example.com',
      submissionTime: null,
    };

    const teamMembers = [memberA, memberB];
    const totalMembers = teamMembers.length;

    const submittedCount = teamMembers.filter(m => m.submissionTime !== null && m.submissionTime <= deadlineTime).length;
    const delayedSubmissionCount = teamMembers.filter(m => m.submissionTime !== null && m.submissionTime > deadlineTime).length;
    const unsubmittedCount = totalMembers - submittedCount - delayedSubmissionCount;

    const submissionRate = (submittedCount / totalMembers) * 100;

    const unsubmittedMembers = teamMembers
      .filter(m => m.submissionTime === null)
      .map(m => ({
        userId: m.userId,
        userName: m.userName,
        email: m.email,
        remainingMinutes: Math.floor((deadlineTime.getTime() - aggregationTime.getTime()) / (1000 * 60)),
      }));

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(2);
    expect(result.submittedCount).toBe(1);
    expect(result.unsubmittedCount).toBe(1);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(50.0);
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe('user-002');
    expect(result.unsubmittedMembers[0].userName).toBe('Member B');
    expect(result.unsubmittedMembers[0].email).toBe('member-b@example.com');
    expect(result.unsubmittedMembers[0].remainingMinutes).toBe(-1);
    expect(result.aggregatedAt).toBeDefined();
    expect(typeof result.aggregatedAt).toBe('string');
  });
});