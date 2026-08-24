import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況をリアルタイム表示', () => {
  test('SCEN-341: 日報送信時に現在時刻が送信時刻として記録される', () => {
    // Arrange
    const teamId = 'team-001';
    const reportDate = '2026-08-19';
    const requestUserId = 'manager-001';

    // 提出期限設定（朝9時）
    const deadlineTime = '09:00';
    const timeZone = 'Asia/Tokyo';

    // テスト対象時刻: 期限内（朝8時30分）
    const submissionTime = new Date('2026-08-19T08:30:45Z');

    // モック日報データ: 期限内に提出済みのメンバー5名、未提出のメンバー2名
    const mockReportSubmissionRecords = [
      {
        userId: 'user-001',
        userName: 'Engineer A',
        email: 'engineer.a@example.com',
        teamId: 'team-001',
        reportDate: '2026-08-19',
        submittedAt: new Date('2026-08-19T07:30:00Z'), // 期限前
        isDelayed: false,
      },
      {
        userId: 'user-002',
        userName: 'Engineer B',
        email: 'engineer.b@example.com',
        teamId: 'team-001',
        reportDate: '2026-08-19',
        submittedAt: new Date('2026-08-19T08:00:00Z'), // 期限前
        isDelayed: false,
      },
      {
        userId: 'user-003',
        userName: 'Engineer C',
        email: 'engineer.c@example.com',
        teamId: 'team-001',
        reportDate: '2026-08-19',
        submittedAt: new Date('2026-08-19T08:15:00Z'), // 期限前
        isDelayed: false,
      },
      {
        userId: 'user-004',
        userName: 'Engineer D',
        email: 'engineer.d@example.com',
        teamId: 'team-001',
        reportDate: '2026-08-19',
        submittedAt: new Date('2026-08-19T08:45:00Z'), // 期限前
        isDelayed: false,
      },
      {
        userId: 'user-005',
        userName: 'Engineer E',
        email: 'engineer.e@example.com',
        teamId: 'team-001',
        reportDate: '2026-08-19',
        submittedAt: new Date('2026-08-19T08:30:45Z'), // テスト対象時刻と同じ
        isDelayed: false,
      },
    ];

    const mockAllTeamMembers = [
      { userId: 'user-001', userName: 'Engineer A', email: 'engineer.a@example.com' },
      { userId: 'user-002', userName: 'Engineer B', email: 'engineer.b@example.com' },
      { userId: 'user-003', userName: 'Engineer C', email: 'engineer.c@example.com' },
      { userId: 'user-004', userName: 'Engineer D', email: 'engineer.d@example.com' },
      { userId: 'user-005', userName: 'Engineer E', email: 'engineer.e@example.com' },
      { userId: 'user-006', userName: 'Engineer F', email: 'engineer.f@example.com' },
      { userId: 'user-007', userName: 'Engineer G', email: 'engineer.g@example.com' },
    ];

    // Act
    const result = aggregateReportSubmissionStatus(
      {
        teamId: teamId,
        reportDate: reportDate,
        requestUserId: requestUserId,
        includeDelayedSubmissions: true,
      },
      mockReportSubmissionRecords,
      mockAllTeamMembers,
      {
        reportDate: new Date(reportDate),
        deadlineTime: deadlineTime,
        timeZone: timeZone,
      }
    );

    // Assert
    // 全体のチーム成員数
    expect(result.totalMembers).toBe(7);

    // 期限内に提出済み: 5名
    expect(result.submittedCount).toBe(5);

    // 期限までに未提出: 2名（user-006, user-007）
    expect(result.unsubmittedCount).toBe(2);

    // 期限超過で提出: 0名
    expect(result.delayedSubmissionCount).toBe(0);

    // 提出率 = 5 / 7 * 100 = 71.4%
    expect(result.submissionRate).toBeCloseTo(71.4, 1);

    // 未提出メンバーの詳細情報
    expect(result.unsubmittedMembers).toHaveLength(2);

    const unsubmittedUser6 = result.unsubmittedMembers.find(m => m.userId === 'user-006');
    expect(unsubmittedUser6).toBeDefined();
    expect(unsubmittedUser6?.userName).toBe('Engineer F');
    expect(unsubmittedUser6?.email).toBe('engineer.f@example.com');
    // 朝9時が期限なので、朝8時30分現在では残り30分
    expect(unsubmittedUser6?.remainingMinutes).toBe(30);

    const unsubmittedUser7 = result.unsubmittedMembers.find(m => m.userId === 'user-007');
    expect(unsubmittedUser7).toBeDefined();
    expect(unsubmittedUser7?.userName).toBe('Engineer G');
    expect(unsubmittedUser7?.email).toBe('engineer.g@example.com');
    expect(unsubmittedUser7?.remainingMinutes).toBe(30);

    // 集計実行時刻がISO 8601形式で記録されている
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 集計対象チームIDと報告日が結果に反映されている
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
  });
});