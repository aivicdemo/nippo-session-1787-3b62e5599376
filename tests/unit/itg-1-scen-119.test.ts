import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Dashboard Real-time Display', () => {
  // SCEN-119
  test('should display accurate submission list when multiple members submit reports with identical timestamps in reverse send order', async () => {
    const now = new Date('2026-08-19T10:00:00.000Z');
    
    const teamId = 'team-engineering-001';
    const reportDate = '2026-08-19';
    const requestUserId = 'user-manager-001';
    
    const memberAId = 'user-member-a';
    const memberBId = 'user-member-b';
    const memberCId = 'user-member-c';
    
    const memberAName = 'Alice';
    const memberBName = 'Bob';
    const memberCName = 'Charlie';
    
    const memberAEmail = 'alice@example.com';
    const memberBEmail = 'bob@example.com';
    const memberCEmail = 'charlie@example.com';
    
    const submissionTimestamp = now;
    
    const reportDeadlineTime = new Date('2026-08-19T09:00:00.000Z');
    
    const mockUnsubmittedMembers = [];
    
    const aggregationResult: ReportSubmissionStatusSummary = {
      teamId: teamId,
      reportDate: reportDate,
      totalMembers: 3,
      submittedCount: 3,
      unsubmittedCount: 0,
      delayedSubmissionCount: 0,
      submissionRate: 100.0,
      unsubmittedMembers: mockUnsubmittedMembers,
      aggregatedAt: now.toISOString()
    };
    
    const input: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true
    };
    
    const result = await aggregateReportSubmissionStatus(input);
    
    expect(result).toEqual(aggregationResult);
    expect(result.submissionRate).toBe(100.0);
    expect(result.submittedCount).toBe(3);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.unsubmittedMembers).toHaveLength(0);
  });
});