import { updateDashboardOnReportSubmission } from '../../src/logic/real-time-dashboard-update';

describe('Real-time Dashboard Update', () => {
  // SCEN-175: [error] ダッシュボード表示データの集計・整形処理に失敗した場合、エラー例外が発生し、ダッシュボード更新に失敗したというエラーメッセージが返される
  test('should throw error with correct message when aggregateCurrentSubmissionStatus fails', () => {
    const reportId = 'RPT-001';
    const reportData = {
      yesterday: '昨日のタスク完了',
      today: '今日のタスク計画',
      issues: '依存関係の遅延',
    };
    const submittedByUserId = 'USR-002';
    const submissionTimestamp = new Date('2024-01-15T09:30:00Z');
    const viewerUserId = 'USR-001';

    expect(() =>
      updateDashboardOnReportSubmission(
        reportId,
        reportData,
        submittedByUserId,
        submissionTimestamp,
        viewerUserId
      )
    ).toThrow(/ダッシュボード更新に失敗しました/);
  });
});