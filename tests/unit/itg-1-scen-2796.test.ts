import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-2796: [edge] 月初（1日）に報告提出状況の日次集計が正確に初期化される
  test('should initialize daily aggregation correctly on month start date with zero submissions', async () => {
    // Arrange
    const targetTeamId = 'team-dev-001';
    const currentReportDate = '2026-08-01';
    const requestUserId = 'user-manager-001';

    const mockTeamMembers = Array.from({ length: 10 }, (_, i) => ({
      userId: `user-engineer-${String(i + 1).padStart(3, '0')}`,
      userName: `Engineer ${i + 1}`,
      email: `engineer${i + 1}@example.com`,
    }));

    const mockSubmissionStatusBefore = {
      teamId: targetTeamId,
      reportDate: '2026-07-31',
      totalMembers: 10,
      submittedCount: 10,
      unsubmittedCount: 0,
      delayedSubmissionCount: 0,
      submissionRate: 100.0,
      unsubmittedMembers: [],
      aggregatedAt: '2026-07-31T23:59:59Z',
    };

    const mockInput = {
      teamId: targetTeamId,
      reportDate: currentReportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock the database to return aggregation data for the new month start date
    // In reality, the implementation would query from DailyReportAggregation table
    // For August 1st (month start), all submissions should be zero-initialized
    const expectedOutput = {
      teamId: targetTeamId,
      reportDate: currentReportDate,
      totalMembers: 10,
      submittedCount: 0,
      unsubmittedCount: 10,
      delayedSubmissionCount: 0,
      submissionRate: 0.0,
      unsubmittedMembers: mockTeamMembers,
      aggregatedAt: '2026-08-01T00:00:00Z',
    };

    // Act
    const result = await aggregateReportSubmissionStatus(mockInput);

    // Assert
    expect(result).toEqual(expectedOutput);
    expect(result.teamId).toBe(targetTeamId);
    expect(result.reportDate).toBe(currentReportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(0);
    expect(result.unsubmittedCount).toBe(10);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(0.0);
    expect(result.unsubmittedMembers).toHaveLength(10);
    expect(result.aggregatedAt).toMatch(/2026-08-01T00:00:00Z/);
  });
});