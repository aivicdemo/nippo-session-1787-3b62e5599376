import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長ダッシュボード提出状況リアルタイム表示機能', () => {
  // SCEN-107
  test('メンバーの報告提出時刻が null で提出ステータスが提出済みのとき、データ整合性エラーが発生する', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'admin-user-001',
      includeDelayedSubmissions: true,
    };

    const mockTeamMembers = [
      {
        userId: 'M001',
        userName: 'Member One',
        email: 'member1@example.com',
      },
    ];

    const mockSubmissionRecords = [
      {
        userId: 'M001',
        teamId: 'team-001',
        reportDate: '2024-01-15',
        submissionStatus: '提出済み',
        submissionTimestamp: null,
        delayedSubmission: false,
      },
    ];

    const mockGetTeamMembers = jest.fn().mockReturnValue(mockTeamMembers);
    const mockGetSubmissionRecords = jest
      .fn()
      .mockReturnValue(mockSubmissionRecords);

    expect(() => {
      aggregateReportSubmissionStatus(input, {
        getTeamMembers: mockGetTeamMembers,
        getSubmissionRecords: mockGetSubmissionRecords,
      });
    }).toThrow(/整合性/);
  });
});