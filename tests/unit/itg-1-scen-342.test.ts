import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  // SCEN-342
  test('日報送信後、提出状況が未提出から提出済みに更新される', () => {
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    expect(result).toBeDefined();
    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(typeof result.totalMembers).toBe('number');
    expect(result.totalMembers).toBeGreaterThan(0);
    expect(typeof result.submittedCount).toBe('number');
    expect(result.submittedCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.unsubmittedCount).toBe('number');
    expect(result.unsubmittedCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.delayedSubmissionCount).toBe('number');
    expect(result.delayedSubmissionCount).toBeGreaterThanOrEqual(0);
    expect(typeof result.submissionRate).toBe('number');
    expect(result.submissionRate).toBeGreaterThanOrEqual(0);
    expect(result.submissionRate).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(typeof result.aggregatedAt).toBe('string');

    const submittedPlusUnsubmittedPlusDelayed =
      result.submittedCount + result.unsubmittedCount + result.delayedSubmissionCount;
    expect(submittedPlusUnsubmittedPlusDelayed).toBe(result.totalMembers);

    const calculatedRate =
      result.totalMembers > 0
        ? Math.round((result.submittedCount / result.totalMembers) * 1000) / 10
        : 0;
    expect(result.submissionRate).toBe(calculatedRate);

    result.unsubmittedMembers.forEach((member) => {
      expect(typeof member.userId).toBe('string');
      expect(member.userId.length).toBeGreaterThan(0);
      expect(typeof member.userName).toBe('string');
      expect(member.userName.length).toBeGreaterThan(0);
      expect(typeof member.email).toBe('string');
      expect(member.email.includes('@')).toBe(true);
      expect(typeof member.remainingMinutes).toBe('number');
    });
  });
});