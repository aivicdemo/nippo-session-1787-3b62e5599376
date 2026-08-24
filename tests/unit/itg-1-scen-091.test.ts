import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('提出状況のリアルタイム集計・表示機能', () => {
  // SCEN-091
  test('期限到達トリガーで同じ入力データを2回実行しても同じ提出状況集計結果が返される', async () => {
    const teamId = 'team-dev-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const firstResult = await aggregateReportSubmissionStatus(input);

    expect(firstResult).toBeDefined();
    expect(firstResult.teamId).toBe(teamId);
    expect(firstResult.reportDate).toBe(reportDate);
    expect(firstResult.totalMembers).toBe(10);
    expect(firstResult.submittedCount).toBe(10);
    expect(firstResult.unsubmittedCount).toBe(0);
    expect(firstResult.delayedSubmissionCount).toBe(0);
    expect(firstResult.submissionRate).toBe(100.0);
    expect(firstResult.unsubmittedMembers).toEqual([]);
    expect(firstResult.aggregatedAt).toBeDefined();

    const secondResult = await aggregateReportSubmissionStatus(input);

    expect(secondResult).toBeDefined();
    expect(secondResult.teamId).toBe(firstResult.teamId);
    expect(secondResult.reportDate).toBe(firstResult.reportDate);
    expect(secondResult.totalMembers).toBe(firstResult.totalMembers);
    expect(secondResult.submittedCount).toBe(firstResult.submittedCount);
    expect(secondResult.unsubmittedCount).toBe(firstResult.unsubmittedCount);
    expect(secondResult.delayedSubmissionCount).toBe(firstResult.delayedSubmissionCount);
    expect(secondResult.submissionRate).toBe(firstResult.submissionRate);
    expect(secondResult.unsubmittedMembers).toEqual(firstResult.unsubmittedMembers);
  });
});