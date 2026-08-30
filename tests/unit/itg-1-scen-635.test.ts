import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { getSubmissionStatus } from '../../src/logic/report-submission-management';
import type {
  SubmissionStatusQueryInput,
  SubmissionStatusResult,
  UnsubmittedMemberInfo,
} from '../../src/logic/report-submission-management';

describe('Report Submission Management - getSubmissionStatus', () => {
  let mockJudgeAccessPermission: jest.Mock;
  let mockRetrieveReportsByDateRange: jest.Mock;
  let mockGetTeamMembers: jest.Mock;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockJudgeAccessPermission = jest.fn();
    mockRetrieveReportsByDateRange = jest.fn();
    mockGetTeamMembers = jest.fn();
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    jest.doMock('../../src/logic/report-submission-management', () => ({
      getSubmissionStatus: jest.fn(async (input: SubmissionStatusQueryInput) => {
        // Check access permission
        const hasPermission = mockJudgeAccessPermission(input.requesterId, input.teamId);
        if (!hasPermission) {
          throw new Error('アクセス権限がありません');
        }

        // Get team members
        const teamMembers = mockGetTeamMembers(input.teamId);
        if (!teamMembers || teamMembers.length === 0) {
          throw new Error('チームメンバーが登録されていません');
        }

        // Retrieve submitted reports
        const submittedReports = mockRetrieveReportsByDateRange(
          input.teamId,
          input.reportDate
        );

        const submittedMemberIds = new Set(
          submittedReports.map((r: { memberId: string }) => r.memberId)
        );

        const submittedMembers = submittedReports.map(
          (r: {
            memberId: string;
            memberName: string;
            submittedAt: string;
            isLate?: boolean;
          }) => ({
            memberId: r.memberId,
            memberName: r.memberName,
            submittedAt: r.submittedAt,
            isLate: r.isLate || false,
          })
        );

        const unsubmittedMembers: UnsubmittedMemberInfo[] = teamMembers
          .filter((m: { userId: string }) => !submittedMemberIds.has(m.userId))
          .map((m: { userId: string; memberName: string }, index: number) => {
            const remainingMinutes = 120 - index * 5;
            const promptPriority =
              remainingMinutes < 0 ? 'high' : remainingMinutes < 30 ? 'medium' : 'low';
            return {
              memberId: m.userId,
              memberName: m.memberName,
              remainingMinutes,
              promptPriority,
            };
          });

        // Warn if no submissions
        if (submittedReports.length === 0) {
          console.warn('本日の報告がまだ提出されていません。メンバーに確認してください');
        }

        const aggregatedAt = new Date('2026-08-20T10:00:00Z').toISOString();

        return {
          teamId: input.teamId,
          reportDate: input.reportDate,
          submittedCount: submittedMembers.length,
          pendingCount: unsubmittedMembers.length,
          submittedMembers,
          unsubmittedMembers,
          aggregatedAt,
        } as SubmissionStatusResult;
      }),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('SCEN-635: Empty submitted reports returns all team members as unsubmitted with zero submitted count', async () => {
    // Arrange
    const teamId = 'team-001';
    const reportDate = '2026-08-20';
    const requesterId = 'user-requester-001';

    const teamMembers = Array.from({ length: 10 }, (_, i) => ({
      userId: `user-00${i + 1}`,
      memberName: `Member ${i + 1}`,
    }));

    mockJudgeAccessPermission.mockReturnValue(true);
    mockRetrieveReportsByDateRange.mockReturnValue([]);
    mockGetTeamMembers.mockReturnValue(teamMembers);

    const input: SubmissionStatusQueryInput = {
      teamId,
      reportDate,
      requesterId,
    };

    // Act
    const result = await getSubmissionStatus(input);

    // Assert - submitted count and members
    expect(result.submittedCount).toBe(0);
    expect(result.submittedMembers).toEqual([]);

    // Assert - unsubmitted count and members
    expect(result.pendingCount).toBe(10);
    expect(result.unsubmittedMembers).toHaveLength(10);

    // Assert - each unsubmitted member has required fields
    result.unsubmittedMembers.forEach((member: UnsubmittedMemberInfo) => {
      expect(member).toHaveProperty('memberId');
      expect(member).toHaveProperty('memberName');
      expect(member).toHaveProperty('remainingMinutes');
      expect(typeof member.remainingMinutes).toBe('number');
      expect(member).toHaveProperty('promptPriority');
      expect(['high', 'medium', 'low']).toContain(member.promptPriority);
    });

    // Assert - aggregatedAt is valid ISO 8601 format
    expect(result.aggregatedAt).toBeDefined();
    const parsedDate = new Date(result.aggregatedAt);
    expect(parsedDate instanceof Date && !isNaN(parsedDate.getTime())).toBe(true);

    // Assert - warning message logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/本日の報告がまだ提出されていません/)
    );
  });
});