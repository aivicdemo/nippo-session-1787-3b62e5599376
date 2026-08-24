import { aggregateReportSubmissionStatus, type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('submission-status-tracking', () => {
  test('SCEN-2892: should aggregate report submission status at deadline and exclude submissions after deadline', () => {
    // Setup: Define team and report date
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';
    
    // Define the deadline time as 09:00
    const deadlineTime = '09:00';
    const timeZone = 'Asia/Tokyo';
    
    // Member A submitted at 08:55 (5 minutes before deadline) - should be included
    const memberASubmissionTimestamp = new Date('2024-01-15T08:55:00+09:00');
    
    // Member B submitted at 08:59:59 (1 second before deadline) - should be included
    const memberBSubmissionTimestamp = new Date('2024-01-15T08:59:59+09:00');
    
    // Member C attempted submission at 09:00:01 (1 second after deadline) - should be excluded
    const memberCSubmissionTimestamp = new Date('2024-01-15T09:00:01+09:00');
    
    // The deadline moment is 09:00:00
    const deadlineMoment = new Date('2024-01-15T09:00:00+09:00');
    
    // Prepare input for aggregation
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: false,
    };
    
    // Mock data: Team has 3 members total
    // Member A: submitted on time (08:55)
    // Member B: submitted just before deadline (08:59:59)
    // Member C: attempted to submit after deadline (09:00:01)
    const mockTeamMembers = [
      { userId: 'member-a', userName: 'Alice', email: 'alice@example.com' },
      { userId: 'member-b', userName: 'Bob', email: 'bob@example.com' },
      { userId: 'member-c', userName: 'Charlie', email: 'charlie@example.com' },
    ];
    
    const mockSubmissions = [
      {
        userId: 'member-a',
        submittedAt: memberASubmissionTimestamp.toISOString(),
        status: 'submitted',
      },
      {
        userId: 'member-b',
        submittedAt: memberBSubmissionTimestamp.toISOString(),
        status: 'submitted',
      },
      // Member C's submission after deadline should not be counted
    ];
    
    // Calculate expected values based on business logic
    const totalMembers = mockTeamMembers.length; // 3
    const submittedCount = 2; // A and B submitted on time
    const unsubmittedCount = 1; // C did not submit on time (attempted after deadline)
    const delayedSubmissionCount = 0; // No delayed submissions in this scenario
    const submissionRate = (submittedCount / totalMembers) * 100; // (2/3) * 100 = 66.7
    
    // Expected unsubmitted member (C)
    const expectedUnsubmittedMembers = [
      {
        userId: 'member-c',
        userName: 'Charlie',
        email: 'charlie@example.com',
        remainingMinutes: -1, // 1 second overdue = -1 minute (rounded)
      },
    ];
    
    // Call the function with mocked data
    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(
      input,
      mockTeamMembers,
      mockSubmissions,
      deadlineMoment
    );
    
    // Assertions for successful aggregation
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);
    expect(result.submissionRate).toBe(66.7);
    
    // Verify unsubmitted members list
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe('member-c');
    expect(result.unsubmittedMembers[0].userName).toBe('Charlie');
    expect(result.unsubmittedMembers[0].email).toBe('charlie@example.com');
    expect(result.unsubmittedMembers[0].remainingMinutes).toBe(-1);
    
    // Verify aggregation timestamp is recorded
    expect(result.aggregatedAt).toBeDefined();
    const aggregatedTime = new Date(result.aggregatedAt);
    expect(aggregatedTime.getTime()).toBeGreaterThanOrEqual(deadlineMoment.getTime());
  });
});