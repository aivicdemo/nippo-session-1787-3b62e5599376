import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長ダッシュボード提出状況リアルタイム表示機能', () => {
  // SCEN-103
  test('メンバーの提出ステータスが定義済みの値以外のとき、エラーが発生する', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2026-08-19',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const invalidMembers = [
      {
        userId: 'member-A',
        userName: 'メンバーA',
        email: 'member-a@example.com',
        submissionStatus: 'invalid_status',
        submittedAt: null,
      },
    ];

    expect(() => {
      aggregateReportSubmissionStatus(input, invalidMembers);
    }).toThrow(/提出ステータス/);
  });
});