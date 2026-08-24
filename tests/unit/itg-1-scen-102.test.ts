import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード提出状況リアルタイム表示機能', () => {
  // SCEN-102: [error] 部長ダッシュボード提出状況リアルタイム表示機能 - メンバーの提出ステータスが null のとき、色分け判定でエラーになる
  test('メンバーの提出ステータスが null のとき、エラーハンドリングが適切に動作すること', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const mockTeamMembers = [
      {
        userId: 'member-001',
        userName: 'エンジニアA',
        email: 'engineer-a@example.com',
        submissionStatus: null,
        submissionTimestamp: null,
      },
      {
        userId: 'member-002',
        userName: 'エンジニアB',
        email: 'engineer-b@example.com',
        submissionStatus: 'submitted',
        submissionTimestamp: new Date('2024-01-15T08:30:00Z'),
      },
    ];

    expect(() => {
      aggregateReportSubmissionStatus(input, mockTeamMembers);
    }).toThrow(/ステータス/);
  });
});