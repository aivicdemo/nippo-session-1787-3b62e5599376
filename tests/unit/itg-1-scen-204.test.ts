import { describe, test, expect } from '@jest/globals';
import { getSubmissionStatus } from '../../src/logic/report-submission-management';

describe('Report Submission Management - getSubmissionStatus', () => {
  test('SCEN-204: should return submission status with negative hours until deadline when deadline has passed', () => {
    // Setup test data
    const reportDeadlineTime = new Date('2024-01-15T08:30:00Z');
    const currentDateTime = new Date('2024-01-15T09:00:00Z');
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requesterId = 'manager-001';

    // Team members: 10 total
    const teamMemberIds = [
      'member-001',
      'member-002',
      'member-003',
      'member-004',
      'member-005',
      'member-006',
      'member-007',
      'member-008',
      'member-009',
      'member-010',
    ];

    // Submitted reports: only 5 members submitted
    const submittedReportsByDate = [
      { memberId: 'member-001', submittedAt: new Date('2024-01-15T08:15:00Z') },
      { memberId: 'member-002', submittedAt: new Date('2024-01-15T08:20:00Z') },
      { memberId: 'member-003', submittedAt: new Date('2024-01-15T08:25:00Z') },
      { memberId: 'member-004', submittedAt: new Date('2024-01-15T08:28:00Z') },
      { memberId: 'member-005', submittedAt: new Date('2024-01-15T08:29:00Z') },
    ];

    // Calculate expected values based on business logic
    const submittedCount = submittedReportsByDate.length; // 5
    const unsubmittedCount = teamMemberIds.length - submittedCount; // 5
    const deadlineTimeMs = reportDeadlineTime.getTime();
    const currentTimeMs = currentDateTime.getTime();
    const remainingTimeMs = deadlineTimeMs - currentTimeMs; // negative value: -1800000ms = -30 minutes
    const remainingHours = remainingTimeMs / (1000 * 60 * 60); // -0.5 hours

    // Call the function
    const result = getSubmissionStatus({
      teamId,
      reportDate,
      requesterId,
    });

    // Assertions
    expect(result).toBeDefined();
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.submittedCount).toBe(5);
    expect(result.unsubmittedCount).toBe(5);

    // Verify unsubmitted members array
    expect(result.unsubmittedMembers).toHaveLength(5);

    // Verify that unsubmitted members have negative hoursUntilDeadline
    result.unsubmittedMembers.forEach((unsubmittedMember) => {
      expect(unsubmittedMember.memberId).toBeDefined();
      expect(typeof unsubmittedMember.memberId).toBe('string');
      expect(unsubmittedMember.memberName).toBeDefined();
      expect(typeof unsubmittedMember.memberName).toBe('string');
      expect(unsubmittedMember.remainingMinutes).toBeLessThan(0);
      expect(unsubmittedMember.promptPriority).toBe('high');
    });

    // Verify aggregatedAt is ISO 8601 format
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify that negative hours are correctly represented
    // 30 minutes past deadline = -30 minutes or -0.5 hours
    const expectedMinutes = -30;
    const actualMinutes = result.unsubmittedMembers[0].remainingMinutes;
    expect(actualMinutes).toBe(expectedMinutes);
  });
});