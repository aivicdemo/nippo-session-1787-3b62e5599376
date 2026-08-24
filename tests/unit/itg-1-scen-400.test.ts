import { describe, test, expect, beforeEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary, UnsubmittedMember } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation - Dashboard Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-400
  test('should aggregate all members as unsubmitted when no reports are submitted by deadline', async () => {
    // Setup: 本日の日付を固定値で設定
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: false
    };

    // Mock repository: チームメンバーは10名、すべて未提出
    const mockUnsubmittedMembers: UnsubmittedMember[] = [
      {
        userId: 'user-001',
        userName: 'Engineer A',
        email: 'engineer-a@example.com',
        remainingMinutes: -15
      },
      {
        userId: 'user-002',
        userName: 'Engineer B',
        email: 'engineer-b@example.com',
        remainingMinutes: -15
      },
      {
        userId: 'user-003',
        userName: 'Engineer C',
        email: 'engineer-c@example.com',
        remainingMinutes: -15
      },
      {
        userId: 'user-004',
        userName: 'Engineer D',
        email: 'engineer-d@example.com',
        remainingMinutes: -15
      },
      {
        userId: 'user-005',
        userName: 'Engineer E',
        email: 'engineer-e@example.com',
        remainingMinutes: -15
      },
      {
        userId: 'user-006',
        userName: 'Engineer F',
        email: 'engineer-f@example.com',
        remainingMinutes: -15
      },
      {
        userId: 'user-007',
        userName: 'Engineer G',
        email: 'engineer-g@example.com',
        remainingMinutes: -15
      },
      {
        userId: 'user-008',
        userName: 'Engineer H',
        email: 'engineer-h@example.com',
        remainingMinutes: -15
      },
      {
        userId: 'user-009',
        userName: 'Engineer I',
        email: 'engineer-i@example.com',
        remainingMinutes: -15
      },
      {
        userId: 'user-010',
        userName: 'Engineer J',
        email: 'engineer-j@example.com',
        remainingMinutes: -15
      }
    ];

    // Execute
    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(input);

    // Verify aggregation results
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(0);
    expect(result.unsubmittedCount).toBe(10);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(0.0);
    expect(result.unsubmittedMembers).toHaveLength(10);
    expect(result.unsubmittedMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-001',
          userName: 'Engineer A',
          email: 'engineer-a@example.com'
        }),
        expect.objectContaining({
          userId: 'user-002',
          userName: 'Engineer B',
          email: 'engineer-b@example.com'
        }),
        expect.objectContaining({
          userId: 'user-003',
          userName: 'Engineer C',
          email: 'engineer-c@example.com'
        }),
        expect.objectContaining({
          userId: 'user-004',
          userName: 'Engineer D',
          email: 'engineer-d@example.com'
        }),
        expect.objectContaining({
          userId: 'user-005',
          userName: 'Engineer E',
          email: 'engineer-e@example.com'
        }),
        expect.objectContaining({
          userId: 'user-006',
          userName: 'Engineer F',
          email: 'engineer-f@example.com'
        }),
        expect.objectContaining({
          userId: 'user-007',
          userName: 'Engineer G',
          email: 'engineer-g@example.com'
        }),
        expect.objectContaining({
          userId: 'user-008',
          userName: 'Engineer H',
          email: 'engineer-h@example.com'
        }),
        expect.objectContaining({
          userId: 'user-009',
          userName: 'Engineer I',
          email: 'engineer-i@example.com'
        }),
        expect.objectContaining({
          userId: 'user-010',
          userName: 'Engineer J',
          email: 'engineer-j@example.com'
        })
      ])
    );

    // Verify timestamp format is ISO 8601
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});