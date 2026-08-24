import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況をリアルタイム表示', () => {
  // SCEN-397: [normal] 報告提出状況の集計機能 - 本日の報告が1件で未提出の場合、提出済み件数0・未提出件数1として集計される
  test('should aggregate report submission status with 9 submitted and 1 unsubmitted member', () => {
    const testTeamId = 'team-001';
    const testReportDate = '2024-01-15';
    const requestUserId = 'manager-001';
    
    const input: AggregateReportSubmissionStatusInput = {
      teamId: testTeamId,
      reportDate: testReportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };
    
    const result = aggregateReportSubmissionStatus(input);
    
    expect(result).toBeDefined();
    expect(result.teamId).toBe(testTeamId);
    expect(result.reportDate).toBe(testReportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(9);
    expect(result.unsubmittedCount).toBe(1);
    expect(result.delayedSubmissionCount).toBe(0);
    
    const expectedSubmissionRate = (9 / 10) * 100;
    expect(result.submissionRate).toBe(expectedSubmissionRate);
    
    expect(result.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.unsubmittedMembers.length).toBe(1);
    
    if (result.unsubmittedMembers.length > 0) {
      const unsubmittedMember = result.unsubmittedMembers[0];
      expect(unsubmittedMember).toHaveProperty('userId');
      expect(unsubmittedMember).toHaveProperty('userName');
      expect(unsubmittedMember).toHaveProperty('email');
      expect(unsubmittedMember).toHaveProperty('remainingMinutes');
      expect(typeof unsubmittedMember.userId).toBe('string');
      expect(typeof unsubmittedMember.userName).toBe('string');
      expect(typeof unsubmittedMember.email).toBe('string');
      expect(typeof unsubmittedMember.remainingMinutes).toBe('number');
    }
    
    expect(result.aggregatedAt).toBeDefined();
    expect(typeof result.aggregatedAt).toBe('string');
    const aggregatedAtDate = new Date(result.aggregatedAt);
    expect(aggregatedAtDate.toString()).not.toBe('Invalid Date');
  });
});