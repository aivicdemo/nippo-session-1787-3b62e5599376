import { getSubmissionStatus } from '../../src/logic/report-submission-management';

describe('Report Submission Management - getSubmissionStatus', () => {
  test('SCEN-317: [edge] submission rate 90% or above - returns aggregated status with submitted and unsubmitted members', () => {
    // Setup: 10 team members, 9 submitted (90%), 1 unsubmitted
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requesterId = 'manager-001';
    const reportDeadlineTime = '08:30';
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

    const submittedMembers = [
      {
        memberId: 'member-001',
        memberName: 'Engineer One',
        submittedAt: '2024-01-15T08:15:00Z',
        isLate: false,
      },
      {
        memberId: 'member-002',
        memberName: 'Engineer Two',
        submittedAt: '2024-01-15T08:20:00Z',
        isLate: false,
      },
      {
        memberId: 'member-003',
        memberName: 'Engineer Three',
        submittedAt: '2024-01-15T08:10:00Z',
        isLate: false,
      },
      {
        memberId: 'member-004',
        memberName: 'Engineer Four',
        submittedAt: '2024-01-15T08:25:00Z',
        isLate: false,
      },
      {
        memberId: 'member-005',
        memberName: 'Engineer Five',
        submittedAt: '2024-01-15T08:12:00Z',
        isLate: false,
      },
      {
        memberId: 'member-006',
        memberName: 'Engineer Six',
        submittedAt: '2024-01-15T08:18:00Z',
        isLate: false,
      },
      {
        memberId: 'member-007',
        memberName: 'Engineer Seven',
        submittedAt: '2024-01-15T08:22:00Z',
        isLate: false,
      },
      {
        memberId: 'member-008',
        memberName: 'Engineer Eight',
        submittedAt: '2024-01-15T08:05:00Z',
        isLate: false,
      },
      {
        memberId: 'member-009',
        memberName: 'Engineer Nine',
        submittedAt: '2024-01-15T08:28:00Z',
        isLate: false,
      },
    ];

    const unsubmittedMembers = [
      {
        memberId: 'member-010',
        memberName: 'Engineer Ten',
        remainingMinutes: 2,
        promptPriority: 'high',
      },
    ];

    // Call the function
    const result = getSubmissionStatus(
      teamId,
      reportDate,
      requesterId,
      reportDeadlineTime,
      teamMemberIds,
      submittedMembers,
      unsubmittedMembers
    );

    // Assertions
    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submittedCount).toBe(9);
    expect(result.unsubmittedCount).toBe(1);

    expect(result.submittedMembers).toHaveLength(9);
    expect(result.submittedMembers[0]).toEqual({
      memberId: 'member-001',
      memberName: 'Engineer One',
      submittedAt: '2024-01-15T08:15:00Z',
      isLate: false,
    });
    expect(result.submittedMembers[8]).toEqual({
      memberId: 'member-009',
      memberName: 'Engineer Nine',
      submittedAt: '2024-01-15T08:28:00Z',
      isLate: false,
    });

    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0]).toEqual({
      memberId: 'member-010',
      memberName: 'Engineer Ten',
      remainingMinutes: 2,
      promptPriority: 'high',
    });

    // aggregatedAt should be in ISO 8601 format
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Verify submission rate is exactly 90%
    const submissionRate = (result.submittedCount / (result.submittedCount + result.unsubmittedCount)) * 100;
    expect(submissionRate).toBe(90);
  });
});