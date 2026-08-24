import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation', () => {
  // SCEN-1666: [edge] 報告提出状況集約機能 - 提出済みと未提出のメンバーが混在する場合、区別なく正しく集計される
  test('should correctly aggregate submission status when members have mixed submission states', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(6);
    expect(result.unsubmittedCount).toBe(4);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(60.0);

    expect(result.unsubmittedMembers).toHaveLength(4);
    expect(result.unsubmittedMembers[0]).toEqual({
      userId: expect.any(String),
      userName: expect.any(String),
      email: expect.any(String),
      remainingMinutes: expect.any(Number),
    });

    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});