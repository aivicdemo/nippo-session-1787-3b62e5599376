import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-1650
  test('メンバーID が欠落しているレコードが混在するとき、処理を中止しエラーコード INVALID_MEMBER_ID を返す', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    const mockMembersWithInvalidId = [
      {
        userId: null,
        userName: 'Invalid Member 1',
        email: 'invalid1@example.com',
        submissionTime: null,
        isDelayedSubmission: false,
      },
      {
        userId: 'user-001',
        userName: 'Member A',
        email: 'membera@example.com',
        submissionTime: '2024-01-15T08:30:00Z',
        isDelayedSubmission: false,
      },
      {
        userId: 'user-002',
        userName: 'Member B',
        email: 'memberb@example.com',
        submissionTime: '2024-01-15T08:35:00Z',
        isDelayedSubmission: false,
      },
      {
        userId: 'user-003',
        userName: 'Member C',
        email: 'memberc@example.com',
        submissionTime: '2024-01-15T08:40:00Z',
        isDelayedSubmission: false,
      },
      {
        userId: 'user-004',
        userName: 'Member D',
        email: 'memberd@example.com',
        submissionTime: '2024-01-15T08:45:00Z',
        isDelayedSubmission: false,
      },
      {
        userId: 'user-005',
        userName: 'Member E',
        email: 'membere@example.com',
        submissionTime: null,
        isDelayedSubmission: false,
      },
      {
        userId: 'user-006',
        userName: 'Member F',
        email: 'memberf@example.com',
        submissionTime: '2024-01-15T08:50:00Z',
        isDelayedSubmission: false,
      },
      {
        userId: 'user-007',
        userName: 'Member G',
        email: 'memberg@example.com',
        submissionTime: '2024-01-15T08:55:00Z',
        isDelayedSubmission: false,
      },
      {
        userId: 'user-008',
        userName: 'Member H',
        email: 'memberh@example.com',
        submissionTime: '2024-01-15T09:00:00Z',
        isDelayedSubmission: false,
      },
      {
        userId: '',
        userName: 'Invalid Member 2',
        email: 'invalid2@example.com',
        submissionTime: null,
        isDelayedSubmission: false,
      },
    ];

    const mockDatabase = {
      getReportSubmissionRecords: jest
        .fn()
        .mockReturnValue(mockMembersWithInvalidId),
      getTeamMembers: jest.fn().mockReturnValue([
        { userId: 'user-001', userName: 'Member A', email: 'membera@example.com' },
        { userId: 'user-002', userName: 'Member B', email: 'memberb@example.com' },
        { userId: 'user-003', userName: 'Member C', email: 'memberc@example.com' },
        { userId: 'user-004', userName: 'Member D', email: 'memberd@example.com' },
        { userId: 'user-005', userName: 'Member E', email: 'membere@example.com' },
        { userId: 'user-006', userName: 'Member F', email: 'memberf@example.com' },
        { userId: 'user-007', userName: 'Member G', email: 'memberg@example.com' },
        { userId: 'user-008', userName: 'Member H', email: 'memberh@example.com' },
        { userId: 'user-009', userName: 'Member I', email: 'memberi@example.com' },
        { userId: 'user-010', userName: 'Member J', email: 'memberj@example.com' },
      ]),
      getUserPermission: jest.fn().mockReturnValue({ canViewTeam: true }),
    };

    expect(() =>
      aggregateReportSubmissionStatus(input, mockDatabase)
    ).toThrow(/INVALID_MEMBER_ID/);
  });
});