import { getSubmissionStatus, type SubmissionStatusQueryInput, type SubmissionStatusResult, type SubmittedMemberInfo, type UnsubmittedMemberInfo } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム', () => {
  // SCEN-632
  test('[normal] 指定日付のチーム全体の報告提出状況を集計し、提出済み・未提出メンバーと提出時刻を返す', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requesterId = 'user-admin-001';

    const mockJudgeAccessPermission = jest.fn().mockReturnValue(true);
    const mockRetrieveReportsByDateRange = jest.fn().mockReturnValue([
      {
        memberId: 'm001',
        submittedAt: '2024-01-15T08:30:00Z',
        status: 'submitted',
      },
      {
        memberId: 'm003',
        submittedAt: '2024-01-15T08:45:00Z',
        status: 'submitted',
      },
      {
        memberId: 'm005',
        submittedAt: '2024-01-15T09:10:00Z',
        status: 'submitted',
      },
    ]);
    const mockDecryptReportDataForManager = jest
      .fn()
      .mockImplementation((encryptedData) => ({
        submittedAt: encryptedData.submittedAt,
        status: encryptedData.status,
      }));

    const input: SubmissionStatusQueryInput = {
      teamId,
      reportDate,
      requesterId,
    };

    const result = getSubmissionStatus(input, {
      judgeAccessPermission: mockJudgeAccessPermission,
      retrieveReportsByDateRange: mockRetrieveReportsByDateRange,
      decryptReportDataForManager: mockDecryptReportDataForManager,
    });

    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.submittedCount).toBe(3);
    expect(result.unsubmittedCount).toBe(7);

    expect(result.submittedMembers).toHaveLength(3);
    const submittedMember0 = result.submittedMembers[0];
    expect(submittedMember0.memberId).toBe('m001');
    expect(submittedMember0.submittedAt).toBe('2024-01-15T08:30:00Z');

    const submittedMember1 = result.submittedMembers[1];
    expect(submittedMember1.memberId).toBe('m003');
    expect(submittedMember1.submittedAt).toBe('2024-01-15T08:45:00Z');

    const submittedMember2 = result.submittedMembers[2];
    expect(submittedMember2.memberId).toBe('m005');
    expect(submittedMember2.submittedAt).toBe('2024-01-15T09:10:00Z');

    expect(result.unsubmittedMembers).toHaveLength(7);

    expect(result.aggregatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(mockJudgeAccessPermission).toHaveBeenCalledTimes(1);
    expect(mockRetrieveReportsByDateRange).toHaveBeenCalledTimes(1);
    expect(mockDecryptReportDataForManager).toHaveBeenCalledTimes(3);
  });
});