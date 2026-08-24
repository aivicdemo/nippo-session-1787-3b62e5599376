import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況追跡機能', () => {
  // SCEN-1101: [edge] 本日の報告提出状況が提出期限の1秒後に提出済みとして更新される
  test('提出期限の1秒後に提出されたユーザーの報告がダッシュボードに提出済みとして表示される', async () => {
    const reportDate = '2026-08-20';
    const teamId = 'team-001';
    const requestUserId = 'manager-001';
    const submissionTimestampAfterDeadline = new Date('2026-08-20T09:00:01Z');

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(1);
    expect(result.unsubmittedCount).toBe(9);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(10.0);
    expect(result.unsubmittedMembers).toHaveLength(9);

    const submittedMember = result.unsubmittedMembers.find(
      (member) => member.userId === 'user-a'
    );
    expect(submittedMember).toBeUndefined();

    expect(result.aggregatedAt).toBeDefined();
    const aggregatedTime = new Date(result.aggregatedAt);
    expect(aggregatedTime.getTime()).toBeGreaterThanOrEqual(submissionTimestampAfterDeadline.getTime());
  });
});