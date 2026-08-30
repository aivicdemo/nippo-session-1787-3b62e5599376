import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { getSubmissionStatus } from '../../src/logic/report-submission-management';

describe('Report Submission Management', () => {
  test('SCEN-621: should aggregate team submission status and warn when deadline has passed', async () => {
    // Test data setup
    const teamId = 'team-001';
    const reportDate = '2025-01-15';
    const requesterId = 'manager-001';
    const reportDeadlineTime = new Date('2025-01-15T08:30:00Z');
    const currentTime = new Date('2025-01-15T08:45:00Z');

    // Team members: 7 submitted, 3 unsubmitted
    const submittedMembers = [
      {
        memberId: 'emp-001',
        memberName: 'Alice Johnson',
        reportStatus: 'submitted' as const,
        submissionTime: new Date('2025-01-15T08:15:00Z'),
        isLate: false,
      },
      {
        memberId: 'emp-002',
        memberName: 'Bob Smith',
        reportStatus: 'submitted' as const,
        submissionTime: new Date('2025-01-15T08:20:00Z'),
        isLate: false,
      },
      {
        memberId: 'emp-003',
        memberName: 'Carol Davis',
        reportStatus: 'submitted' as const,
        submissionTime: new Date('2025-01-15T08:10:00Z'),
        isLate: false,
      },
      {
        memberId: 'emp-004',
        memberName: 'David Wilson',
        reportStatus: 'submitted' as const,
        submissionTime: new Date('2025-01-15T08:25:00Z'),
        isLate: false,
      },
      {
        memberId: 'emp-005',
        memberName: 'Eva Martinez',
        reportStatus: 'submitted' as const,
        submissionTime: new Date('2025-01-15T08:12:00Z'),
        isLate: false,
      },
      {
        memberId: 'emp-006',
        memberName: 'Frank Brown',
        reportStatus: 'submitted' as const,
        submissionTime: new Date('2025-01-15T08:28:00Z'),
        isLate: false,
      },
      {
        memberId: 'emp-007',
        memberName: 'Grace Lee',
        reportStatus: 'submitted' as const,
        submissionTime: new Date('2025-01-15T08:05:00Z'),
        isLate: false,
      },
    ];

    const unsubmittedMembers = [
      {
        memberId: 'emp-008',
        memberName: 'Henry Clark',
        reportStatus: 'pending' as const,
        submissionTime: null,
        delayedCount: 5,
        promptPriority: 'high' as const,
      },
      {
        memberId: 'emp-009',
        memberName: 'Iris White',
        reportStatus: 'pending' as const,
        submissionTime: null,
        delayedCount: 3,
        promptPriority: 'medium' as const,
      },
      {
        memberId: 'emp-010',
        memberName: 'Jack Green',
        reportStatus: 'pending' as const,
        submissionTime: null,
        delayedCount: 1,
        promptPriority: 'low' as const,
      },
    ];

    const allMembers = [...submittedMembers, ...unsubmittedMembers];

    // Mock dependencies
    const mockJudgeAccessPermission = jest.fn().mockResolvedValue(true);
    const mockRetrieveReportsByDateRange = jest.fn().mockResolvedValue(submittedMembers);
    const mockDecryptReportDataForManager = jest.fn().mockImplementation((data) => data);
    const mockLogWarning = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Call function with mocked dependencies
    const result = await getSubmissionStatus(
      {
        teamId,
        reportDate,
        requesterId,
      },
      {
        judgeAccessPermission: mockJudgeAccessPermission,
        retrieveReportsByDateRange: mockRetrieveReportsByDateRange,
        decryptReportDataForManager: mockDecryptReportDataForManager,
        getAllTeamMembers: jest.fn().mockResolvedValue(allMembers),
        getCurrentTime: jest.fn().mockReturnValue(currentTime),
        getReportDeadline: jest.fn().mockReturnValue(reportDeadlineTime),
      }
    );

    // Assertions for submitted members
    expect(result.submittedCount).toBe(7);
    expect(result.submittedMembers).toHaveLength(7);
    expect(result.submittedMembers[0]).toMatchObject({
      memberId: 'emp-001',
      memberName: 'Alice Johnson',
      isLate: false,
    });

    // Assertions for unsubmitted members
    expect(result.unsubmittedCount).toBe(3);
    expect(result.unsubmittedMembers).toHaveLength(3);

    // Verify unsubmitted members are sorted by priority (high -> medium -> low)
    expect(result.unsubmittedMembers[0]).toMatchObject({
      memberId: 'emp-008',
      memberName: 'Henry Clark',
      promptPriority: 'high',
      remainingMinutes: -15,
    });

    expect(result.unsubmittedMembers[1]).toMatchObject({
      memberId: 'emp-009',
      memberName: 'Iris White',
      promptPriority: 'medium',
      remainingMinutes: -15,
    });

    expect(result.unsubmittedMembers[2]).toMatchObject({
      memberId: 'emp-010',
      memberName: 'Jack Green',
      promptPriority: 'low',
      remainingMinutes: -15,
    });

    // Assertions for overall status
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.aggregatedAt).toBe(currentTime.toISOString());

    // Verify warning was logged due to deadline being passed
    expect(mockLogWarning).toHaveBeenCalledWith(
      expect.stringContaining('報告期限が過ぎています。催促を急いでください')
    );

    mockLogWarning.mockRestore();
  });
});