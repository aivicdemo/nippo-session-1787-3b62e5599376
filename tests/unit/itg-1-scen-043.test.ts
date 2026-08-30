import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { getSubmissionStatus } from '../../src/logic/report-submission-management';

describe('Report Submission Management', () => {
  test('SCEN-043: aggregates team report submission status for specified date with submitted and unsubmitted members', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requesterId = 'user-manager-001';

    const submittedMember1 = {
      memberId: 'member-001',
      memberName: 'Member A',
      submittedAt: '2024-01-15T08:15:00Z',
      isLate: false,
    };

    const submittedMember2 = {
      memberId: 'member-002',
      memberName: 'Member B',
      submittedAt: '2024-01-15T08:22:00Z',
      isLate: false,
    };

    const submittedMember3 = {
      memberId: 'member-003',
      memberName: 'Member C',
      submittedAt: '2024-01-15T08:45:00Z',
      isLate: false,
    };

    const unsubmittedMember1 = {
      memberId: 'member-004',
      memberName: 'Member D',
      remainingMinutes: 45,
      promptPriority: 'high',
    };

    const unsubmittedMember2 = {
      memberId: 'member-005',
      memberName: 'Member E',
      remainingMinutes: 45,
      promptPriority: 'medium',
    };

    const mockJudgeAccessPermission = jest.fn().mockResolvedValue(true);
    const mockRetrieveReportsByDateRange = jest.fn().mockResolvedValue([
      {
        reportId: 'report-001',
        memberId: submittedMember1.memberId,
        reportDate: reportDate,
        submittedAt: submittedMember1.submittedAt,
      },
      {
        reportId: 'report-002',
        memberId: submittedMember2.memberId,
        reportDate: reportDate,
        submittedAt: submittedMember2.submittedAt,
      },
      {
        reportId: 'report-003',
        memberId: submittedMember3.memberId,
        reportDate: reportDate,
        submittedAt: submittedMember3.submittedAt,
      },
    ]);

    const mockDecryptReportDataForManager = jest
      .fn()
      .mockImplementation((reportData) => Promise.resolve(reportData));

    const mockGetTeamMembers = jest.fn().mockResolvedValue([
      { memberId: submittedMember1.memberId, memberName: submittedMember1.memberName },
      { memberId: submittedMember2.memberId, memberName: submittedMember2.memberName },
      { memberId: submittedMember3.memberId, memberName: submittedMember3.memberName },
      { memberId: unsubmittedMember1.memberId, memberName: unsubmittedMember1.memberName },
      { memberId: unsubmittedMember2.memberId, memberName: unsubmittedMember2.memberName },
    ]);

    const mockCalculateRemainingTime = jest
      .fn()
      .mockImplementation((memberId) => {
        if (
          memberId === unsubmittedMember1.memberId ||
          memberId === unsubmittedMember2.memberId
        ) {
          return Promise.resolve({ remainingMinutes: 45 });
        }
        return Promise.resolve({ remainingMinutes: 0 });
      });

    jest.doMock('../../src/logic/access-control', () => ({
      judgeAccessPermission: mockJudgeAccessPermission,
    }));

    jest.doMock('../../src/logic/report-data-retrieval', () => ({
      retrieveReportsByDateRange: mockRetrieveReportsByDateRange,
      decryptReportDataForManager: mockDecryptReportDataForManager,
    }));

    jest.doMock('../../src/logic/team-management', () => ({
      getTeamMembers: mockGetTeamMembers,
    }));

    jest.doMock('../../src/logic/deadline-calculation', () => ({
      calculateRemainingTime: mockCalculateRemainingTime,
    }));

    const result = await getSubmissionStatus(teamId, reportDate, requesterId);

    expect(result).toBeDefined();
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.submittedCount).toBe(3);
    expect(result.unsubmittedCount).toBe(2);

    expect(result.submittedMembers).toHaveLength(3);
    expect(result.submittedMembers[0]).toEqual({
      memberId: submittedMember1.memberId,
      memberName: submittedMember1.memberName,
      submittedAt: submittedMember1.submittedAt,
      isLate: false,
    });
    expect(result.submittedMembers[1]).toEqual({
      memberId: submittedMember2.memberId,
      memberName: submittedMember2.memberName,
      submittedAt: submittedMember2.submittedAt,
      isLate: false,
    });
    expect(result.submittedMembers[2]).toEqual({
      memberId: submittedMember3.memberId,
      memberName: submittedMember3.memberName,
      submittedAt: submittedMember3.submittedAt,
      isLate: false,
    });

    expect(result.unsubmittedMembers).toHaveLength(2);
    expect(result.unsubmittedMembers[0]).toEqual({
      memberId: unsubmittedMember1.memberId,
      memberName: unsubmittedMember1.memberName,
      remainingMinutes: 45,
      promptPriority: 'high',
    });
    expect(result.unsubmittedMembers[1]).toEqual({
      memberId: unsubmittedMember2.memberId,
      memberName: unsubmittedMember2.memberName,
      remainingMinutes: 45,
      promptPriority: 'medium',
    });

    expect(result.aggregatedAt).toBeDefined();
    expect(typeof result.aggregatedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.aggregatedAt)).toBe(true);

    expect(mockJudgeAccessPermission).toHaveBeenCalledWith(teamId, requesterId);
    expect(mockRetrieveReportsByDateRange).toHaveBeenCalledWith(teamId, reportDate);
    expect(mockGetTeamMembers).toHaveBeenCalledWith(teamId);
  });
});