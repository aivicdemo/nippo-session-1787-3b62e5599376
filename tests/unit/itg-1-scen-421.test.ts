import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation - Deadline Boundary Edge Case', () => {
  test('SCEN-421: When report deadline matches current system time exactly, member submission status is judged accurately', () => {
    // Setup: Fixed deadline and system time at exact boundary
    const deadlineTime = '2024-01-15T09:00:00Z';
    const currentSystemTime = new Date('2024-01-15T09:00:00Z');
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';

    // Member A: Not submitted (no report record)
    const memberA = {
      userId: 'user-a-001',
      userName: 'Member A',
      email: 'member-a@example.com',
      teamId: teamId,
      reportSubmittedAt: null,
    };

    // Member B: Submitted on time (report saved before deadline)
    const memberB = {
      userId: 'user-b-001',
      userName: 'Member B',
      email: 'member-b@example.com',
      teamId: teamId,
      reportSubmittedAt: new Date('2024-01-15T08:55:00Z'),
    };

    // Member C: Submitted on time (report saved before deadline)
    const memberC = {
      userId: 'user-c-001',
      userName: 'Member C',
      email: 'member-c@example.com',
      teamId: teamId,
      reportSubmittedAt: new Date('2024-01-15T08:30:00Z'),
    };

    const teamMembers = [memberA, memberB, memberC];
    const totalMembers = teamMembers.length; // 3

    // Calculate expected submission counts
    const submittedCount = teamMembers.filter(m => m.reportSubmittedAt !== null && m.reportSubmittedAt <= new Date(deadlineTime)).length; // 2
    const unsubmittedCount = totalMembers - submittedCount; // 1
    const delayedSubmissionCount = 0; // No submissions after deadline in this scenario
    const submissionRate = Number(((submittedCount / totalMembers) * 100).toFixed(1)); // 66.7

    // Prepare unsubmitted members list
    const unsubmittedMembers = teamMembers
      .filter(m => m.reportSubmittedAt === null)
      .map(m => ({
        userId: m.userId,
        userName: m.userName,
        email: m.email,
        remainingMinutes: -0, // Exactly at deadline, so remaining time is 0
      }));

    // Execute aggregation
    const result = aggregateReportSubmissionStatus({
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    });

    // Verify aggregation results with boundary-exact values
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);
    expect(result.submissionRate).toBe(submissionRate);

    // Verify unsubmitted members contain exactly Member A
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe('user-a-001');
    expect(result.unsubmittedMembers[0].userName).toBe('Member A');
    expect(result.unsubmittedMembers[0].email).toBe('member-a@example.com');

    // Verify aggregated timestamp is precisely at the deadline boundary
    expect(result.aggregatedAt).toBe('2024-01-15T09:00:00.000Z');

    // Verify submission status judgment is accurate at boundary
    const memberBStatus = result.unsubmittedMembers.find(m => m.userId === 'user-b-001');
    const memberCStatus = result.unsubmittedMembers.find(m => m.userId === 'user-c-001');

    expect(memberBStatus).toBeUndefined(); // Member B should NOT be in unsubmitted list
    expect(memberCStatus).toBeUndefined(); // Member C should NOT be in unsubmitted list
  });
});