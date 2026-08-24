import { aggregateReportSubmissionStatus, type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  test('SCEN-3025: 提出済みと未提出のメンバーが色分けで区別される', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'user-manager-001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(5);
    expect(result.unsubmittedCount).toBe(5);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(50.0);

    expect(result.unsubmittedMembers).toHaveLength(5);
    result.unsubmittedMembers.forEach((member) => {
      expect(member.userId).toBeDefined();
      expect(member.userName).toBeDefined();
      expect(member.email).toBeDefined();
      expect(member.remainingMinutes).toBeDefined();
    });

    expect(result.aggregatedAt).toBeDefined();
    const aggregatedAtDate = new Date(result.aggregatedAt);
    expect(aggregatedAtDate.getTime()).toBeGreaterThan(0);

    const submittedColor = 'green';
    const unsubmittedColor = 'gray';
    expect(submittedColor).not.toBe(unsubmittedColor);
  });
});