import { describe, test, expect, beforeEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Real-time Display - 10 Team Members with 4 Submitted', () => {
  test('SCEN-3050: When 4 out of 10 team members submit reports, submission status displays accurately in real-time', async () => {
    // Setup: Initialize 10 team members with all in unsubmitted state
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    // Mock data for all 10 team members - initial state (all unsubmitted)
    const allTeamMembers = [
      { userId: 'user-A', userName: 'User A', email: 'userA@company.com' },
      { userId: 'user-B', userName: 'User B', email: 'userB@company.com' },
      { userId: 'user-C', userName: 'User C', email: 'userC@company.com' },
      { userId: 'user-D', userName: 'User D', email: 'userD@company.com' },
      { userId: 'user-E', userName: 'User E', email: 'userE@company.com' },
      { userId: 'user-F', userName: 'User F', email: 'userF@company.com' },
      { userId: 'user-G', userName: 'User G', email: 'userG@company.com' },
      { userId: 'user-H', userName: 'User H', email: 'userH@company.com' },
      { userId: 'user-I', userName: 'User I', email: 'userI@company.com' },
      { userId: 'user-J', userName: 'User J', email: 'userJ@company.com' },
    ];

    // Test 1: Initial state - all unsubmitted
    const initialInput = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    const initialResult = aggregateReportSubmissionStatus(initialInput, allTeamMembers, []);

    expect(initialResult.totalMembers).toBe(10);
    expect(initialResult.submittedCount).toBe(0);
    expect(initialResult.unsubmittedCount).toBe(10);
    expect(initialResult.delayedSubmissionCount).toBe(0);
    expect(initialResult.submissionRate).toBe(0.0);
    expect(initialResult.unsubmittedMembers).toHaveLength(10);
    expect(initialResult.unsubmittedMembers.map((m) => m.userId)).toEqual([
      'user-A',
      'user-B',
      'user-C',
      'user-D',
      'user-E',
      'user-F',
      'user-G',
      'user-H',
      'user-I',
      'user-J',
    ]);

    // Test 2: After User A submits (submitted count = 1)
    const submittedRecords1 = [{ userId: 'user-A', submissionTimestamp: new Date('2024-01-15T09:01:00Z') }];

    const result1 = aggregateReportSubmissionStatus(initialInput, allTeamMembers, submittedRecords1);

    expect(result1.totalMembers).toBe(10);
    expect(result1.submittedCount).toBe(1);
    expect(result1.unsubmittedCount).toBe(9);
    expect(result1.delayedSubmissionCount).toBe(0);
    expect(result1.submissionRate).toBe(10.0);
    expect(result1.unsubmittedMembers).toHaveLength(9);
    expect(result1.unsubmittedMembers.map((m) => m.userId)).toEqual([
      'user-B',
      'user-C',
      'user-D',
      'user-E',
      'user-F',
      'user-G',
      'user-H',
      'user-I',
      'user-J',
    ]);

    // Test 3: After User B submits (submitted count = 2)
    const submittedRecords2 = [
      { userId: 'user-A', submissionTimestamp: new Date('2024-01-15T09:01:00Z') },
      { userId: 'user-B', submissionTimestamp: new Date('2024-01-15T09:02:00Z') },
    ];

    const result2 = aggregateReportSubmissionStatus(initialInput, allTeamMembers, submittedRecords2);

    expect(result2.totalMembers).toBe(10);
    expect(result2.submittedCount).toBe(2);
    expect(result2.unsubmittedCount).toBe(8);
    expect(result2.delayedSubmissionCount).toBe(0);
    expect(result2.submissionRate).toBe(20.0);
    expect(result2.unsubmittedMembers).toHaveLength(8);
    expect(result2.unsubmittedMembers.map((m) => m.userId)).toEqual([
      'user-C',
      'user-D',
      'user-E',
      'user-F',
      'user-G',
      'user-H',
      'user-I',
      'user-J',
    ]);

    // Test 4: After User C submits (submitted count = 3)
    const submittedRecords3 = [
      { userId: 'user-A', submissionTimestamp: new Date('2024-01-15T09:01:00Z') },
      { userId: 'user-B', submissionTimestamp: new Date('2024-01-15T09:02:00Z') },
      { userId: 'user-C', submissionTimestamp: new Date('2024-01-15T09:03:00Z') },
    ];

    const result3 = aggregateReportSubmissionStatus(initialInput, allTeamMembers, submittedRecords3);

    expect(result3.totalMembers).toBe(10);
    expect(result3.submittedCount).toBe(3);
    expect(result3.unsubmittedCount).toBe(7);
    expect(result3.delayedSubmissionCount).toBe(0);
    expect(result3.submissionRate).toBe(30.0);
    expect(result3.unsubmittedMembers).toHaveLength(7);
    expect(result3.unsubmittedMembers.map((m) => m.userId)).toEqual([
      'user-D',
      'user-E',
      'user-F',
      'user-G',
      'user-H',
      'user-I',
      'user-J',
    ]);

    // Test 5: After User D submits (submitted count = 4) - Final state
    const submittedRecords4 = [
      { userId: 'user-A', submissionTimestamp: new Date('2024-01-15T09:01:00Z') },
      { userId: 'user-B', submissionTimestamp: new Date('2024-01-15T09:02:00Z') },
      { userId: 'user-C', submissionTimestamp: new Date('2024-01-15T09:03:00Z') },
      { userId: 'user-D', submissionTimestamp: new Date('2024-01-15T09:04:00Z') },
    ];

    const result4 = aggregateReportSubmissionStatus(initialInput, allTeamMembers, submittedRecords4);

    expect(result4.totalMembers).toBe(10);
    expect(result4.submittedCount).toBe(4);
    expect(result4.unsubmittedCount).toBe(6);
    expect(result4.delayedSubmissionCount).toBe(0);
    expect(result4.submissionRate).toBe(40.0);
    expect(result4.teamId).toBe(teamId);
    expect(result4.reportDate).toBe(reportDate);

    // Verify unsubmitted members list contains exactly Users E through J
    expect(result4.unsubmittedMembers).toHaveLength(6);
    const unsubmittedUserIds = result4.unsubmittedMembers.map((m) => m.userId);
    expect(unsubmittedUserIds).toEqual(['user-E', 'user-F', 'user-G', 'user-H', 'user-I', 'user-J']);

    // Verify unsubmitted member details are complete and correct
    const userERecord = result4.unsubmittedMembers.find((m) => m.userId === 'user-E');
    expect(userERecord).toBeDefined();
    expect(userERecord?.userName).toBe('User E');
    expect(userERecord?.email).toBe('userE@company.com');
    expect(typeof userERecord?.remainingMinutes).toBe('number');

    const userJRecord = result4.unsubmittedMembers.find((m) => m.userId === 'user-J');
    expect(userJRecord).toBeDefined();
    expect(userJRecord?.userName).toBe('User J');
    expect(userJRecord?.email).toBe('userJ@company.com');

    // Verify aggregatedAt timestamp is present and in ISO 8601 format
    expect(result4.aggregatedAt).toBeDefined();
    const aggregatedAtDate = new Date(result4.aggregatedAt);
    expect(aggregatedAtDate instanceof Date).toBe(true);
    expect(aggregatedAtDate.toString()).not.toBe('Invalid Date');
  });
});