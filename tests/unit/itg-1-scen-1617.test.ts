import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況集計機能', () => {
  // SCEN-1617
  test('チームメンバー1人の報告提出状況を集計し、1人の提出済み・未提出状態が返される', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'TEAM_001',
      reportDate: '2024-01-15',
      requestUserId: 'MANAGER_001',
      includeDelayedSubmissions: true
    };

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe('TEAM_001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(1);
    expect(result.submittedCount).toBe(1);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(100.0);
    expect(result.unsubmittedMembers).toHaveLength(0);
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});