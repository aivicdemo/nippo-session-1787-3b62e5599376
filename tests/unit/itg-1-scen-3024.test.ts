import { describe, test, expect } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation', () => {
  test('SCEN-3024: real-time submission status display with multiple unsubmitted members', () => {
    // Setup: 10 team members with 7 submitted and 3 unsubmitted
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    // Mock data: 10 team members
    const allMembers = [
      { userId: 'user-a', userName: 'User A', email: 'user.a@company.com', teamId },
      { userId: 'user-b', userName: 'User B', email: 'user.b@company.com', teamId },
      { userId: 'user-c', userName: 'User C', email: 'user.c@company.com', teamId },
      { userId: 'user-d', userName: 'User D', email: 'user.d@company.com', teamId },
      { userId: 'user-e', userName: 'User E', email: 'user.e@company.com', teamId },
      { userId: 'user-f', userName: 'User F', email: 'user.f@company.com', teamId },
      { userId: 'user-g', userName: 'User G', email: 'user.g@company.com', teamId },
      { userId: 'user-h', userName: 'User H', email: 'user.h@company.com', teamId },
      { userId: 'user-i', userName: 'User I', email: 'user.i@company.com', teamId },
      { userId: 'user-j', userName: 'User J', email: 'user.j@company.com', teamId },
    ];

    // Submitted members: D, E, F, G, H, I, J (7 members)
    const submittedUserIds = ['user-d', 'user-e', 'user-f', 'user-g', 'user-h', 'user-i', 'user-j'];
    // Unsubmitted members: A, B, C (3 members)
    const unsubmittedUserIds = ['user-a', 'user-b', 'user-c'];

    // Deadline: 09:00 on 2024-01-15
    const deadlineTime = new Date('2024-01-15T09:00:00Z');

    // Current time: 09:15 (15 minutes after deadline)
    const currentTime = new Date('2024-01-15T09:15:00Z');

    // Input
    const input: Parameters<typeof aggregateReportSubmissionStatus>[0] = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock repository/database to return status
    // Note: In actual implementation, aggregateReportSubmissionStatus would fetch this data
    // For this test, we assume the function receives or fetches the necessary data

    // Call the function
    const result = aggregateReportSubmissionStatus(input);

    // Assertions
    expect(result).toBeDefined();
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(7);
    expect(result.unsubmittedCount).toBe(3);
    expect(result.submissionRate).toBe(70.0);

    // Verify unsubmitted members list
    expect(result.unsubmittedMembers).toHaveLength(3);

    // Extract unsubmitted user IDs from result
    const resultUnsubmittedUserIds = result.unsubmittedMembers
      .map((member) => member.userId)
      .sort();

    // Expected unsubmitted user IDs sorted
    const expectedUnsubmittedUserIds = ['user-a', 'user-b', 'user-c'].sort();

    // Verify exact match
    expect(resultUnsubmittedUserIds).toEqual(expectedUnsubmittedUserIds);

    // Verify each unsubmitted member has correct details
    const unsubmittedMemberA = result.unsubmittedMembers.find((m) => m.userId === 'user-a');
    expect(unsubmittedMemberA).toBeDefined();
    expect(unsubmittedMemberA!.userName).toBe('User A');
    expect(unsubmittedMemberA!.email).toBe('user.a@company.com');
    expect(typeof unsubmittedMemberA!.remainingMinutes).toBe('number');

    const unsubmittedMemberB = result.unsubmittedMembers.find((m) => m.userId === 'user-b');
    expect(unsubmittedMemberB).toBeDefined();
    expect(unsubmittedMemberB!.userName).toBe('User B');
    expect(unsubmittedMemberB!.email).toBe('user.b@company.com');

    const unsubmittedMemberC = result.unsubmittedMembers.find((m) => m.userId === 'user-c');
    expect(unsubmittedMemberC).toBeDefined();
    expect(unsubmittedMemberC!.userName).toBe('User C');
    expect(unsubmittedMemberC!.email).toBe('user.c@company.com');

    // Verify submitted members are NOT in unsubmitted list
    submittedUserIds.forEach((userId) => {
      expect(result.unsubmittedMembers.find((m) => m.userId === userId)).toBeUndefined();
    });

    // Verify aggregatedAt is set to ISO 8601 format
    expect(result.aggregatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    );
  });
});