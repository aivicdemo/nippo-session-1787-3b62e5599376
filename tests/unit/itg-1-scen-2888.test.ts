import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況をリアルタイム表示', () => {
  // SCEN-2888: [normal] 提出状況表示機能 - 朝会開始30分前時点で、部長ダッシュボードに提出済みメンバーが複数件として表示される
  test('朝会開始30分前に提出済みメンバー6名がダッシュボードに一覧表示される', () => {
    // テスト開始時刻を朝会開始予定時刻の30分前に設定
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00+09:00');
    const thirtyMinutesBefore = new Date(morningMeetingStartTime.getTime() - 30 * 60 * 1000);

    // 報告対象日
    const reportDate = '2024-01-15';

    // チームID
    const teamId = 'team-001';

    // 部長ユーザーID
    const requestUserId = 'user-manager-001';

    // メンバーA～F（6名）の報告送信
    const submittedMemberA = {
      userId: 'user-member-001',
      userName: 'メンバーA',
      email: 'member-a@example.com',
      submissionTimestamp: new Date('2024-01-15T08:15:00+09:00'), // 朝会30分前より前に提出
    };

    const submittedMemberB = {
      userId: 'user-member-002',
      userName: 'メンバーB',
      email: 'member-b@example.com',
      submissionTimestamp: new Date('2024-01-15T08:20:00+09:00'),
    };

    const submittedMemberC = {
      userId: 'user-member-003',
      userName: 'メンバーC',
      email: 'member-c@example.com',
      submissionTimestamp: new Date('2024-01-15T08:25:00+09:00'),
    };

    const submittedMemberD = {
      userId: 'user-member-004',
      userName: 'メンバーD',
      email: 'member-d@example.com',
      submissionTimestamp: new Date('2024-01-15T08:28:00+09:00'),
    };

    const submittedMemberE = {
      userId: 'user-member-005',
      userName: 'メンバーE',
      email: 'member-e@example.com',
      submissionTimestamp: new Date('2024-01-15T08:29:00+09:00'),
    };

    const submittedMemberF = {
      userId: 'user-member-006',
      userName: 'メンバーF',
      email: 'member-f@example.com',
      submissionTimestamp: new Date('2024-01-15T08:29:30+09:00'),
    };

    // 未提出メンバー（4名）
    const unsubmittedMemberG = {
      userId: 'user-member-007',
      userName: 'メンバーG',
      email: 'member-g@example.com',
    };

    const unsubmittedMemberH = {
      userId: 'user-member-008',
      userName: 'メンバーH',
      email: 'member-h@example.com',
    };

    const unsubmittedMemberI = {
      userId: 'user-member-009',
      userName: 'メンバーI',
      email: 'member-i@example.com',
    };

    const unsubmittedMemberJ = {
      userId: 'user-member-010',
      userName: 'メンバーJ',
      email: 'member-j@example.com',
    };

    // チームメンバー総数: 10名
    const totalMembers = 10;
    // 提出済み: 6名
    const submittedCount = 6;
    // 未提出: 4名
    const unsubmittedCount = 4;
    // 期限超過で提出: 0名
    const delayedSubmissionCount = 0;

    // 提出率の計算: 6 / 10 * 100 = 60.0%
    const submissionRate = 60.0;

    const input = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // aggregateReportSubmissionStatus 関数を呼び出す
    const result = aggregateReportSubmissionStatus(input);

    // 期待結果を検証
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);
    expect(result.submissionRate).toBe(submissionRate);

    // 未提出メンバー情報の検証
    expect(result.unsubmittedMembers).toHaveLength(unsubmittedCount);

    // 未提出メンバーA～Dが一覧に含まれることを確認
    const unsubmittedMemberIds = result.unsubmittedMembers.map((m) => m.userId);
    expect(unsubmittedMemberIds).toContain(unsubmittedMemberG.userId);
    expect(unsubmittedMemberIds).toContain(unsubmittedMemberH.userId);
    expect(unsubmittedMemberIds).toContain(unsubmittedMemberI.userId);
    expect(unsubmittedMemberIds).toContain(unsubmittedMemberJ.userId);

    // 未提出メンバーの詳細情報を検証
    const unsubmittedMemberGInfo = result.unsubmittedMembers.find(
      (m) => m.userId === unsubmittedMemberG.userId,
    );
    expect(unsubmittedMemberGInfo).toBeDefined();
    expect(unsubmittedMemberGInfo?.userName).toBe(unsubmittedMemberG.userName);
    expect(unsubmittedMemberGInfo?.email).toBe(unsubmittedMemberG.email);

    // 集計実行時刻がISO 8601形式で記録されていることを確認
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});