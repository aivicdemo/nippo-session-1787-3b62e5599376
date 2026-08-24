import { describe, test, expect } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード提出状況リアルタイム表示', () => {
  // SCEN-473: [edge] 報告提出状況リアルタイム表示機能 - 全10名のメンバーが報告を提出した時点で提出完了状況が即座に反映される
  test('should display real-time submission status updates for all 10 team members with immediate counter increment', () => {
    const teamId = 'team-alpha-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-lead-001';

    const testTeamMembers = [
      { userId: 'user-001', userName: 'Member 1', email: 'member1@company.com' },
      { userId: 'user-002', userName: 'Member 2', email: 'member2@company.com' },
      { userId: 'user-003', userName: 'Member 3', email: 'member3@company.com' },
      { userId: 'user-004', userName: 'Member 4', email: 'member4@company.com' },
      { userId: 'user-005', userName: 'Member 5', email: 'member5@company.com' },
      { userId: 'user-006', userName: 'Member 6', email: 'member6@company.com' },
      { userId: 'user-007', userName: 'Member 7', email: 'member7@company.com' },
      { userId: 'user-008', userName: 'Member 8', email: 'member8@company.com' },
      { userId: 'user-009', userName: 'Member 9', email: 'member9@company.com' },
      { userId: 'user-010', userName: 'Member 10', email: 'member10@company.com' },
    ];

    const submittedUserIds = testTeamMembers.map((member) => member.userId);
    const totalTeamMembers = testTeamMembers.length;

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock context: all 10 members have submitted on time
    const mockAggregationContext = {
      teamId,
      reportDate,
      totalMembers: totalTeamMembers,
      submittedMembers: submittedUserIds,
      unsubmittedMembers: [],
      delayedSubmissions: [],
      submissionDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      currentTime: new Date('2024-01-15T08:55:00Z'),
    };

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input, mockAggregationContext);

    // Assertion 1: Total member count matches expected value
    expect(result.totalMembers).toBe(10);

    // Assertion 2: All members submitted on time
    expect(result.submittedCount).toBe(10);

    // Assertion 3: No unsubmitted members
    expect(result.unsubmittedCount).toBe(0);

    // Assertion 4: No delayed submissions in this scenario
    expect(result.delayedSubmissionCount).toBe(0);

    // Assertion 5: Submission rate is 100.0%
    expect(result.submissionRate).toBe(100.0);

    // Assertion 6: Unsubmitted members list is empty
    expect(result.unsubmittedMembers).toHaveLength(0);
    expect(result.unsubmittedMembers).toEqual([]);

    // Assertion 7: Aggregation was executed and timestamp is recorded
    expect(result.aggregatedAt).toBeDefined();
    expect(typeof result.aggregatedAt).toBe('string');

    // Assertion 8: Verify structure completeness of output
    expect(result).toHaveProperty('teamId');
    expect(result).toHaveProperty('reportDate');
    expect(result).toHaveProperty('totalMembers');
    expect(result).toHaveProperty('submittedCount');
    expect(result).toHaveProperty('unsubmittedCount');
    expect(result).toHaveProperty('delayedSubmissionCount');
    expect(result).toHaveProperty('submissionRate');
    expect(result).toHaveProperty('unsubmittedMembers');
    expect(result).toHaveProperty('aggregatedAt');

    // Assertion 9: Verify team ID and report date are preserved
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);

    // Assertion 10: Verify calculation correctness: submissionRate = (submittedCount / totalMembers) * 100
    const expectedSubmissionRate = (result.submittedCount / result.totalMembers) * 100;
    expect(result.submissionRate).toBe(expectedSubmissionRate);
  });
});