import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Real-time Display - All Members Submitted', () => {
  // SCEN-3052: [edge] 報告提出状況リアルタイム表示機能 - チーム10名全員が提出済みのとき（最大規模）、未提出メンバーが空の状態で正確に表示される
  test('should display empty unsubmitted members list when all 10 team members have submitted their reports on time', () => {
    // Arrange: テストデータの準備
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'user-admin-001';

    // チーム10名全員のメンバーデータを定義
    const allTeamMembers = Array.from({ length: 10 }, (_, index) => ({
      userId: `user-member-${String(index + 1).padStart(2, '0')}`,
      userName: `Engineer ${index + 1}`,
      email: `engineer${index + 1}@example.com`,
    }));

    // 報告提出状況データ: 10名全員が期限内に提出済み
    const submissionStatusRecords = allTeamMembers.map((member) => ({
      userId: member.userId,
      teamId,
      reportDate,
      submittedAt: new Date('2024-01-15T08:30:00Z'), // 朝会開始前に提出
      status: 'submitted' as const,
      delayedSubmission: false,
    }));

    // Mock database state: チーム総メンバー数 10 人、全員提出済み
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Act: 報告提出状況の集計処理を実行
    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(
      input,
      allTeamMembers,
      submissionStatusRecords
    );

    // Assert: 期待値による検証
    // 1. チーム総メンバー数が 10
    expect(result.totalMembers).toBe(10);

    // 2. 期限内に提出済みが 10
    expect(result.submittedCount).toBe(10);

    // 3. 未提出メンバー数が 0
    expect(result.unsubmittedCount).toBe(0);

    // 4. 期限超過の提出が 0
    expect(result.delayedSubmissionCount).toBe(0);

    // 5. 提出率が 100.0%
    expect(result.submissionRate).toBe(100.0);

    // 6. 未提出メンバーリストが空配列
    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.unsubmittedMembers.length).toBe(0);

    // 7. 集計対象チームIDが正しく設定
    expect(result.teamId).toBe(teamId);

    // 8. 集計対象の報告日が正しく設定
    expect(result.reportDate).toBe(reportDate);

    // 9. 集計実行時刻がISO 8601形式で記録されている
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});