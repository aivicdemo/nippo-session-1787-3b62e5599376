import { updateDashboardOnReportSubmission } from '../../src/logic/real-time-dashboard-update';

describe('朝会報告管理システム - リアルタイムダッシュボード更新', () => {
  // SCEN-174: [error] 新しい日報が送信されたときにダッシュボード表示データをリアルタイム更新し、提出状況サマリーと優先度別課題一覧を最新の状態に保つ。 - 送信された日報データが必須項目を欠いているか形式が不正である場合。のとき日報データが不正です。必須項目を確認してください。となる
  test('should throw error when report data is missing required fields', () => {
    const reportId = 'RPT001';
    const reportData = {
      実績: '',
      課題: null,
      予定: undefined,
    };
    const submittedByUserId = 'USR001';
    const submissionTimestamp = new Date('2024-01-15T10:30:00Z');
    const viewerUserId = 'MGR001';

    expect(() =>
      updateDashboardOnReportSubmission(
        reportId,
        reportData,
        submittedByUserId,
        submissionTimestamp,
        viewerUserId
      )
    ).toThrow(/日報データが不正です。必須項目を確認してください。/);
  });
});