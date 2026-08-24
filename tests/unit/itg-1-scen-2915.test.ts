import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  // SCEN-2915: [edge] 提出状況集計機能 - 未提出メンバーの件数が0件と確定する
  test('全メンバーが提出済みの場合、未提出メンバー件数が0となり未提出メンバー一覧が空となること', () => {
    const teamId = 'team-001';
    const reportDate = '2024-12-16';
    const requestUserId = 'manager-001';

    const input = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(10);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(100.0);
    expect(result.unsubmittedMembers).toEqual([]);
    expect(typeof result.aggregatedAt).toBe('string');
  });
});