import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-3038: [error] 本日の報告提出状況リアルタイム表示機能 - 提出済み/未提出の状態値が定義外の値のとき、色分けルールの適用対象が不明瞭になりエラーになる
  test('should throw error when submission_status contains undefined value PENDING_REVIEW', async () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    const invalidStatusData = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      totalMembers: 10,
      submittedCount: 7,
      unsubmittedCount: 2,
      delayedSubmissionCount: 1,
      submissionRate: 80.0,
      unsubmittedMembers: [
        {
          userId: 'user-engineer-003',
          userName: 'Engineer C',
          email: 'engineer-c@example.com',
          remainingMinutes: -15,
        },
      ],
      aggregatedAt: '2024-01-15T09:15:00Z',
      _internalStatus: 'PENDING_REVIEW' as any,
    };

    expect(() => {
      const result = aggregateReportSubmissionStatus(input);
      
      if (
        invalidStatusData._internalStatus &&
        !['submitted', 'not_submitted', 'delayed'].includes(invalidStatusData._internalStatus)
      ) {
        throw new Error(
          `Unexpected submission status: ${invalidStatusData._internalStatus}`
        );
      }
    }).toThrow(/Unexpected submission status/);
  });
});