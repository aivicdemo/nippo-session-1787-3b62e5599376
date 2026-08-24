import { describe, test, expect, beforeEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { 
  AggregateReportSubmissionStatusInput,
  ReportSubmissionStatusSummary,
  UnsubmittedMember 
} from '../../src/logic/submission-status-tracking';

describe('aggregateReportSubmissionStatus', () => {
  // SCEN-2802: [edge] 報告提出状況リアルタイム表示機能 - 複数チームの報告提出状況がチーム別に正確に分類される
  test('should accurately aggregate and separate submission status for multiple teams with correct submission rates', async () => {
    const reportDate = '2024-01-15';
    const requestUserId = 'manager_001';

    // チームA: 3名中2名提出済み (提出率: 66.7%)
    const teamA_input: AggregateReportSubmissionStatusInput = {
      teamId: 'team_a',
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true
    };

    // チームB: 4名全員提出済み (提出率: 100%)
    const teamB_input: AggregateReportSubmissionStatusInput = {
      teamId: 'team_b',
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true
    };

    // チームC: 3名中1名提出済み (提出率: 33.3%)
    const teamC_input: AggregateReportSubmissionStatusInput = {
      teamId: 'team_c',
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true
    };

    // Execute aggregations for each team
    const teamA_result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(teamA_input);
    const teamB_result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(teamB_input);
    const teamC_result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(teamC_input);

    // Verify チームA results
    expect(teamA_result.teamId).toBe('team_a');
    expect(teamA_result.reportDate).toBe('2024-01-15');
    expect(teamA_result.totalMembers).toBe(3);
    expect(teamA_result.submittedCount).toBe(2);
    expect(teamA_result.unsubmittedCount).toBe(1);
    expect(teamA_result.submissionRate).toBe(66.7);
    expect(teamA_result.unsubmittedMembers).toHaveLength(1);

    // Verify チームB results
    expect(teamB_result.teamId).toBe('team_b');
    expect(teamB_result.reportDate).toBe('2024-01-15');
    expect(teamB_result.totalMembers).toBe(4);
    expect(teamB_result.submittedCount).toBe(4);
    expect(teamB_result.unsubmittedCount).toBe(0);
    expect(teamB_result.submissionRate).toBe(100.0);
    expect(teamB_result.unsubmittedMembers).toHaveLength(0);

    // Verify チームC results
    expect(teamC_result.teamId).toBe('team_c');
    expect(teamC_result.reportDate).toBe('2024-01-15');
    expect(teamC_result.totalMembers).toBe(3);
    expect(teamC_result.submittedCount).toBe(1);
    expect(teamC_result.unsubmittedCount).toBe(2);
    expect(teamC_result.submissionRate).toBe(33.3);
    expect(teamC_result.unsubmittedMembers).toHaveLength(2);

    // Verify that unsubmitted members are correctly populated for チームC
    const teamC_unsubmitted = teamC_result.unsubmittedMembers;
    expect(teamC_unsubmitted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: expect.any(String),
          userName: expect.any(String),
          email: expect.any(String),
          remainingMinutes: expect.any(Number)
        })
      ])
    );

    // Verify no data leakage between teams
    expect(teamA_result.unsubmittedMembers.every(m => m.userId.startsWith('team_a'))).toBe(true);
    expect(teamB_result.unsubmittedMembers.every(m => m.userId.startsWith('team_b'))).toBe(true);
    expect(teamC_result.unsubmittedMembers.every(m => m.userId.startsWith('team_c'))).toBe(true);

    // Verify aggregatedAt timestamp is in ISO 8601 format
    expect(teamA_result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(teamB_result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(teamC_result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});