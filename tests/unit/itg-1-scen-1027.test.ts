import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Real-time Dashboard Display', () => {
  // SCEN-1027
  test('should aggregate and display real-time report submission status with 1 unsubmitted member out of 10', () => {
    // Setup: 10-member team, 9 submitted on time, 1 unsubmitted
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    const input = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Expected calculation based on structured formula:
    // totalMembers = 10 (team size)
    // submittedCount = 9 (on-time submissions)
    // unsubmittedCount = 1 (pending)
    // delayedSubmissionCount = 0 (no overdue submissions in this scenario)
    // submissionRate = (9 / 10) * 100 = 90.0%

    const mockUnsubmittedMember = {
      userId: 'user-tanaka-001',
      userName: '田中太郎',
      email: 'tanaka.taro@example.com',
      remainingMinutes: 45, // 45 minutes until deadline
    };

    const result = aggregateReportSubmissionStatus(input);

    // Assertions with concrete values from structured formula
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(9);
    expect(result.unsubmittedCount).toBe(1);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(90.0);

    // Verify unsubmitted members list contains exactly 1 member
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0]).toEqual(mockUnsubmittedMember);

    // Verify aggregation timestamp is recorded (ISO 8601 format)
    expect(result.aggregatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // Verify dashboard display properties for real-time visibility
    // - unsubmittedMembers array is populated for prominent display
    expect(result.unsubmittedMembers.length).toBeGreaterThan(0);
    // - memberName is clearly present in unsubmitted member object
    expect(result.unsubmittedMembers[0].userName).toBe('田中太郎');
    // - visual emphasis indicators present (remainingMinutes for warning color logic)
    expect(result.unsubmittedMembers[0].remainingMinutes).toBeLessThan(60);
    // - submission rate provides numeric progress display
    expect(result.submissionRate).toBeLessThan(100);
  });
});