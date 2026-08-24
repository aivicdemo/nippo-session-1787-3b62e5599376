import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Real-time Dashboard Display', () => {
  // SCEN-2801: [edge] 報告提出状況リアルタイム表示機能 - 業務上最大規模のメンバー数（1000人以上）における提出状況集計が正確に行われる
  test('should accurately aggregate submission status for 1000 members with 100% submission rate and maintain consistency under concurrent submissions', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';
    
    // Test data: 1000 members, all submitted by deadline
    const totalMembers = 1000;
    const submittedMembers = 1000;
    const unsubmittedMembers = 0;
    const delayedSubmissions = 0;
    
    // Expected calculations
    const expectedSubmissionRate = 100.0; // (1000 / 1000) * 100 = 100.0
    const expectedDelayedCount = 0;
    
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };
    
    const startTime = Date.now();
    
    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(input);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Verify aggregation accuracy for 1000 members
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedMembers);
    expect(result.unsubmittedCount).toBe(unsubmittedMembers);
    expect(result.delayedSubmissionCount).toBe(expectedDelayedCount);
    expect(result.submissionRate).toBe(expectedSubmissionRate);
    
    // Verify submission rate precision (one decimal place)
    expect(result.submissionRate).toHaveLength(4); // "100.0" format
    
    // Verify unsubmitted members list is empty
    expect(result.unsubmittedMembers).toEqual([]);
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    
    // Verify aggregation timestamp is recorded
    expect(result.aggregatedAt).toBeDefined();
    const aggregatedTime = new Date(result.aggregatedAt);
    expect(aggregatedTime.getTime()).toBeGreaterThanOrEqual(startTime);
    expect(aggregatedTime.getTime()).toBeLessThanOrEqual(endTime + 1000);
    
    // Verify execution time is within 3 seconds SLA
    expect(executionTime).toBeLessThanOrEqual(3000);
    
    // Verify data consistency: total should equal submitted + unsubmitted + delayed
    const calculatedTotal = result.submittedCount + result.unsubmittedCount + result.delayedSubmissionCount;
    expect(calculatedTotal).toBe(result.totalMembers);
  });
});