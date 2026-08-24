import { sortAndGroupProgressComparison } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-3044
  test('未提出フラグが null のとき、色分けルール判定がエラーになる', () => {
    const memberWithNullSubmissionFlag = {
      memberId: 'member-001',
      memberName: 'テストエンジニア太郎',
      teamId: 'team-dev-01',
      submissionStatus: 'pending',
      submissionFlag: null,
      progressStatus: 'in_progress',
      priorityScore: 75,
    };

    const progressGroupData = [
      {
        groupKey: 'unsubmitted',
        groupLabel: '未提出メンバー',
        members: [memberWithNullSubmissionFlag],
      },
    ];

    expect(() => {
      sortAndGroupProgressComparison(progressGroupData);
    }).toThrow(/submissionFlag/);
  });
});