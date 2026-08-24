import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('提出状況表示機能 - リアルタイム集計', () => {
  // SCEN-2886
  test('朝会開始30分前時点で、部長ダッシュボードに提出済みメンバーが0件として表示される', () => {
    // 朝会開始時刻: 9:00
    // テスト対象日時: 朝会開始30分前 = 8:30
    // この時点では誰も日報を提出していない想定

    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-director-001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    // 期待値の算出:
    // - 朝会開始30分前 (8:30) の時点では未提出の状態
    // - submittedCount = 0 (誰も提出していない)
    // - unsubmittedCount = チームメンバー総数 (全員未提出)
    // - delayedSubmissionCount = 0 (期限前なので遅延提出なし)
    // - submissionRate = 0 / 総メンバー数 = 0%
    // - unsubmittedMembers = チーム全メンバーのリスト

    expect(result).toEqual({
      teamId,
      reportDate,
      totalMembers: expect.any(Number),
      submittedCount: 0,
      unsubmittedCount: expect.any(Number),
      delayedSubmissionCount: 0,
      submissionRate: 0.0,
      unsubmittedMembers: expect.any(Array),
      aggregatedAt: expect.any(String),
    });

    // 具体的な検証:
    expect(result.submittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(0.0);
    expect(result.unsubmittedCount).toBe(result.totalMembers);
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});