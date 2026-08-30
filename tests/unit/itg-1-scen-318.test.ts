import { getSubmissionStatus } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 報告提出状況集計', () => {
  // SCEN-318
  test('指定日付のチーム全体の報告提出状況を集計し、提出期限を30分以上超過している場合に警告を記録する', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requesterId = 'user-manager-001';
    const morningMeetingStartTime = '08:30';
    const currentTime = new Date('2024-01-15T09:15:00Z');

    const teamMemberIds = [
      'user-eng-001',
      'user-eng-002',
      'user-eng-003',
      'user-eng-004',
      'user-eng-005',
      'user-eng-006',
      'user-eng-007',
      'user-eng-008',
      'user-eng-009',
      'user-eng-010',
    ];

    const submittedReports = [
      {
        memberId: 'user-eng-001',
        memberName: 'Engineer A',
        submittedAt: '2024-01-15T08:10:00Z',
        isLate: false,
      },
      {
        memberId: 'user-eng-002',
        memberName: 'Engineer B',
        submittedAt: '2024-01-15T08:25:00Z',
        isLate: false,
      },
      {
        memberId: 'user-eng-003',
        memberName: 'Engineer C',
        submittedAt: '2024-01-15T08:45:00Z',
        isLate: true,
      },
      {
        memberId: 'user-eng-004',
        memberName: 'Engineer D',
        submittedAt: '2024-01-15T08:50:00Z',
        isLate: true,
      },
      {
        memberId: 'user-eng-005',
        memberName: 'Engineer E',
        submittedAt: '2024-01-15T09:00:00Z',
        isLate: true,
      },
    ];

    const unsubmittedMemberIds = [
      'user-eng-006',
      'user-eng-007',
      'user-eng-008',
      'user-eng-009',
      'user-eng-010',
    ];

    const unsubmittedMembers = unsubmittedMemberIds.map((memberId, index) => {
      const engineerName = String.fromCharCode(70 + index);
      return {
        memberId,
        memberName: `Engineer ${engineerName}`,
        remainingMinutes: -45,
        promptPriority: 'high',
      };
    });

    const stubJudgeAccessPermission = jest.fn().mockResolvedValue({
      isAuthorized: true,
    });

    const stubRetrieveReportsByDateRange = jest.fn().mockResolvedValue(submittedReports);

    const stubDecryptReportDataForManager = jest.fn().mockResolvedValue({
      memberName: 'Decrypted Member',
      yesterdayWork: 'Work completed',
      todayPlan: 'Plan for today',
      issues: 'Issues encountered',
    });

    const mockContext = {
      judgeAccessPermission: stubJudgeAccessPermission,
      retrieveReportsByDateRange: stubRetrieveReportsByDateRange,
      decryptReportDataForManager: stubDecryptReportDataForManager,
    };

    const result = getSubmissionStatus(
      {
        teamId,
        reportDate,
        requesterId,
      },
      {
        teamMemberIds,
        morningMeetingStartTime,
        currentTime,
      },
      mockContext as any
    );

    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.submittedCount).toBe(5);
    expect(result.unsubmittedCount).toBe(5);
    expect(result.submittedMembers).toHaveLength(5);
    expect(result.submittedMembers[0]).toMatchObject({
      memberId: 'user-eng-001',
      memberName: 'Engineer A',
      submittedAt: '2024-01-15T08:10:00Z',
      isLate: false,
    });
    expect(result.unsubmittedMembers).toHaveLength(5);
    expect(result.unsubmittedMembers[0]).toMatchObject({
      memberId: 'user-eng-006',
      memberName: 'Engineer F',
      remainingMinutes: -45,
      promptPriority: 'high',
    });
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});