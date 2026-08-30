import { updateDashboardOnReportSubmission } from '../../src/logic/real-time-dashboard-update';

describe('朝会報告管理システム - リアルタイムダッシュボード更新', () => {
  // SCEN-173: [normal] 新しい日報が送信されたときにダッシュボード表示データをリアルタイム更新し、提出状況サマリーと優先度別課題一覧を最新の状態に保つ
  test('should update dashboard with latest report submission and display prioritized issues in real-time', () => {
    // テスト用の代表的な正常入力データ
    const reportId = 'RPT-2024-001';
    const reportData = {
      yesterday: '顧客対応完了',
      today: 'レポート作成',
      issues: 'システム遅延'
    };
    const submittedByUserId = 'USER-001';
    const submissionTimestamp = new Date('2024-01-15T10:30:00Z');
    const viewerUserId = 'MANAGER-001';

    // 入力オブジェクトを構成
    const updateInput = {
      reportId,
      reportData,
      submittedByUserId,
      submissionTimestamp,
      viewerUserId
    };

    // updateDashboardOnReportSubmissionを呼び出し
    const result = updateDashboardOnReportSubmission(updateInput);

    // success フラグが true であることを確認
    expect(result.success).toBe(true);

    // updatedDashboardData が提出状況サマリーを含むことを確認
    expect(result.updatedDashboardData).toBeDefined();
    expect(result.updatedDashboardData.submissionStatusSummary).toBeDefined();
    expect(result.updatedDashboardData.submissionStatusSummary.submittedCount).toBe(9);
    expect(result.updatedDashboardData.submissionStatusSummary.unsubmittedCount).toBe(1);

    // updatedDashboardData が未提出者リストを含むことを確認
    expect(result.updatedDashboardData.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(result.updatedDashboardData.unsubmittedMembers)).toBe(true);

    // updatedDashboardData が優先度別課題一覧を含むことを確認
    expect(result.updatedDashboardData.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.updatedDashboardData.prioritizedIssues)).toBe(true);

    // updateTimestamp が送信時刻と同一であることを確認
    expect(result.updateTimestamp).toEqual(submissionTimestamp);
  });
});