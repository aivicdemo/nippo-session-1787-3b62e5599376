import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況集計機能', () => {
  // SCEN-2964: [normal] 報告提出状況集計機能 - 提出済みメンバーが1人のとき、その1人が提出済みで他は未提出と判定される
  test('提出済みメンバーが1人のとき提出率が10%で計算される', () => {
    // Arrange: テスト環境の初期設定
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'user-manager-001';
    
    // 10名のチームメンバーを定義
    const totalMembers = 10;
    const submittedCount = 1; // メンバーA 1名のみ提出済み
    const unsubmittedCount = 9; // 他の9名は未提出
    const delayedSubmissionCount = 0; // 期限超過の提出はなし

    // 集計対象のテストデータ
    const aggregateInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // 未提出メンバーの詳細情報（メンバーA以外の9名）
    const unsubmittedMembersList = [
      {
        userId: 'user-002',
        userName: 'メンバーB',
        email: 'member-b@example.com',
        remainingMinutes: -30, // 期限から30分超過
      },
      {
        userId: 'user-003',
        userName: 'メンバーC',
        email: 'member-c@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'user-004',
        userName: 'メンバーD',
        email: 'member-d@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'user-005',
        userName: 'メンバーE',
        email: 'member-e@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'user-006',
        userName: 'メンバーF',
        email: 'member-f@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'user-007',
        userName: 'メンバーG',
        email: 'member-g@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'user-008',
        userName: 'メンバーH',
        email: 'member-h@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'user-009',
        userName: 'メンバーI',
        email: 'member-i@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'user-010',
        userName: 'メンバーJ',
        email: 'member-j@example.com',
        remainingMinutes: -30,
      },
    ];

    // Act: 報告提出状況集計機能を実行
    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(aggregateInput);

    // Assert: 集計結果の検証
    // 1. チームID と報告日が正しく反映されている
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);

    // 2. メンバー数の集計が正しい
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);

    // 3. 提出率が正確に計算されている（期待値: 1 / 10 = 0.1 = 10%）
    const expectedSubmissionRate = 10.0; // 小数第1位まで: 10.0%
    expect(result.submissionRate).toBe(expectedSubmissionRate);

    // 4. 未提出メンバー一覧が正しく含まれている
    expect(result.unsubmittedMembers).toHaveLength(unsubmittedCount);
    
    // 5. 最初の未提出メンバー（メンバーB）の情報を検証
    const firstUnsubmittedMember = result.unsubmittedMembers[0];
    expect(firstUnsubmittedMember.userId).toBe('user-002');
    expect(firstUnsubmittedMember.userName).toBe('メンバーB');
    expect(firstUnsubmittedMember.email).toBe('member-b@example.com');
    expect(typeof firstUnsubmittedMember.remainingMinutes).toBe('number');

    // 6. aggregatedAt がISO 8601形式で記録されている
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});