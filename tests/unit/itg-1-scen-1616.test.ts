import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況集計機能', () => {
  // SCEN-1616
  test('チームメンバー0人に対する報告提出状況を集計し、空の提出状況リストが返される', () => {
    const input = {
      teamId: 'team-empty-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-director-001',
      includeDelayedSubmissions: true,
    };

    const result = aggregateReportSubmissionStatus(input);

    expect(result).toBeDefined();
    expect(result.teamId).toBe('team-empty-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(0);
    expect(result.submittedCount).toBe(0);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(0.0);
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.unsubmittedMembers.length).toBe(0);
    expect(result.aggregatedAt).toBeDefined();
    expect(typeof result.aggregatedAt).toBe('string');
  });
});