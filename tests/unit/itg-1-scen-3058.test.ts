import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type {
  AggregateReportSubmissionStatusInput,
  ReportSubmissionStatusSummary,
  UnsubmittedMember,
} from '../../src/logic/submission-status-tracking';

describe('report submission status real-time display', () => {
  // SCEN-3058
  test('should display accurate submission status on month-end morning dashboard access', async () => {
    const reportDate = '2024-02-28';
    const requestUserId = 'manager-001';
    const teamId = 'team-dev-001';

    const submittedMemberIds = [
      'engineer-001',
      'engineer-002',
      'engineer-003',
      'engineer-004',
      'engineer-005',
    ];

    const unsubmittedMemberIds = [
      'engineer-006',
      'engineer-007',
      'engineer-008',
      'engineer-009',
      'engineer-010',
    ];

    const unsubmittedMembers: UnsubmittedMember[] = unsubmittedMemberIds.map(
      (userId, index) => ({
        userId,
        userName: `Engineer ${index + 6}`,
        email: `engineer-${index + 6}@company.example.com`,
        remainingMinutes:
          index === 0
            ? 180
            : index === 1
              ? 120
              : index === 2
                ? 60
                : index === 3
                  ? 30
                  : -15,
      })
    );

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result: ReportSubmissionStatusSummary =
      await aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(5);
    expect(result.unsubmittedCount).toBe(5);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(50.0);

    expect(result.unsubmittedMembers).toHaveLength(5);

    const firstUnsubmittedMember = result.unsubmittedMembers[0];
    expect(firstUnsubmittedMember.userId).toBe('engineer-006');
    expect(firstUnsubmittedMember.userName).toBe('Engineer 6');
    expect(firstUnsubmittedMember.email).toBe('engineer-006@company.example.com');
    expect(firstUnsubmittedMember.remainingMinutes).toBe(180);

    const overdueMember = result.unsubmittedMembers[4];
    expect(overdueMember.userId).toBe('engineer-010');
    expect(overdueMember.remainingMinutes).toBe(-15);

    const aggregatedAtDate = new Date(result.aggregatedAt);
    expect(aggregatedAtDate.toISOString()).toMatch(/2024-02-28T07:30:00/);
  });
});