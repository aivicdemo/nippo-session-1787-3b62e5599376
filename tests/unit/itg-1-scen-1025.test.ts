import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード - 報告提出状況リアルタイム表示機能', () => {
  // SCEN-1025
  test('報告対象者が0人の場合、提出状況が正常に表示される', () => {
    const input = {
      teamId: 'DEPT-EMPTY',
      reportDate: '2024-01-15',
      requestUserId: 'D001',
      includeDelayedSubmissions: true,
    };

    const result = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe('DEPT-EMPTY');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(0);
    expect(result.submittedCount).toBe(0);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(0);
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.unsubmittedMembers.length).toBe(0);
    expect(typeof result.aggregatedAt).toBe('string');
  });
});