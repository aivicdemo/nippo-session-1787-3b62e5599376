import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-1026
  test('未提出メンバーが複数いるとき、部長向けダッシュボードで未提出メンバーが一目で把握できる表示形式になっている', () => {
    const teamId = 'team-engineering-001';
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
    expect(result.submittedCount).toBe(7);
    expect(result.unsubmittedCount).toBe(3);
    expect(result.delayedSubmissionCount).toBe(0);

    const submissionRate = (result.submittedCount / result.totalMembers) * 100;
    expect(result.submissionRate).toBe(70.0);

    expect(result.unsubmittedMembers).toHaveLength(3);

    const unsubmittedUserIds = result.unsubmittedMembers.map((member) => member.userId);
    expect(unsubmittedUserIds).toContain('user-member-a');
    expect(unsubmittedUserIds).toContain('user-member-b');
    expect(unsubmittedUserIds).toContain('user-member-c');

    const memberA = result.unsubmittedMembers.find((m) => m.userId === 'user-member-a');
    expect(memberA).toBeDefined();
    expect(memberA?.userName).toBe('メンバーA');
    expect(memberA?.email).toBe('member-a@example.com');
    expect(typeof memberA?.remainingMinutes).toBe('number');

    const memberB = result.unsubmittedMembers.find((m) => m.userId === 'user-member-b');
    expect(memberB).toBeDefined();
    expect(memberB?.userName).toBe('メンバーB');
    expect(memberB?.email).toBe('member-b@example.com');
    expect(typeof memberB?.remainingMinutes).toBe('number');

    const memberC = result.unsubmittedMembers.find((m) => m.userId === 'user-member-c');
    expect(memberC).toBeDefined();
    expect(memberC?.userName).toBe('メンバーC');
    expect(memberC?.email).toBe('member-c@example.com');
    expect(typeof memberC?.remainingMinutes).toBe('number');

    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});