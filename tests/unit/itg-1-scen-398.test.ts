import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation', () => {
  // SCEN-398: [normal] 報告提出状況の集計機能 - 本日の報告が複数件で提出済みと未提出が混在する場合、それぞれの件数が正確に集計される
  test('should accurately aggregate submission status with 6 submitted and 4 unsubmitted members on the same day', () => {
    const targetDate = '2024-01-15';
    const teamId = 'team-dev-001';
    const requestUserId = 'user-manager-001';
    const totalMembers = 10;
    const submittedCount = 6;
    const unsubmittedCount = 4;
    const delayedSubmissionCount = 0;

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate: targetDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const unsubmittedMembers = [
      {
        userId: 'user-eng-007',
        userName: '山田太郎',
        email: 'yamada.taro@example.com',
        remainingMinutes: 45,
      },
      {
        userId: 'user-eng-008',
        userName: '鈴木次郎',
        email: 'suzuki.jiro@example.com',
        remainingMinutes: 45,
      },
      {
        userId: 'user-eng-009',
        userName: '佐藤三郎',
        email: 'sato.saburo@example.com',
        remainingMinutes: 45,
      },
      {
        userId: 'user-eng-010',
        userName: '田中四郎',
        email: 'tanaka.shiro@example.com',
        remainingMinutes: 45,
      },
    ];

    const expectedSubmissionRate = 60.0;

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(targetDate);
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);
    expect(result.submissionRate).toBe(expectedSubmissionRate);
    expect(result.unsubmittedMembers).toHaveLength(unsubmittedCount);
    expect(result.unsubmittedMembers[0]).toEqual(unsubmittedMembers[0]);
    expect(result.unsubmittedMembers[1]).toEqual(unsubmittedMembers[1]);
    expect(result.unsubmittedMembers[2]).toEqual(unsubmittedMembers[2]);
    expect(result.unsubmittedMembers[3]).toEqual(unsubmittedMembers[3]);
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});