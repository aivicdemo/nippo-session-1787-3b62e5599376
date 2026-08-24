import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  // SCEN-2130: [edge] データ保持期間管理・自動削除機能 - 保持期間がちょうど満了した日時のデータが削除対象として判定される
  test('should mark report as deletion target when created exactly at retention period boundary', async () => {
    // Arrange
    const now = new Date('2026-09-15T09:00:00Z');
    const retentionDays = 30;
    const retentionBoundary = new Date('2026-08-16T09:00:00Z');
    const beforeBoundary = new Date('2026-08-16T08:59:59Z');
    const afterBoundary = new Date('2026-08-16T09:00:01Z');

    const reportAtBoundary = {
      reportId: 'report_001',
      reporterId: 'user001',
      teamId: 'team_001',
      reportDate: '2026-08-16',
      submissionTimestamp: retentionBoundary.toISOString(),
      content: 'Yesterday: Task A completed / Today: Task B start / Issue: Resource shortage',
      submissionStatus: 'submitted' as const,
      isMarkedForDeletion: false,
      deletedAt: null as string | null,
    };

    const reportBeforeBoundary = {
      reportId: 'report_002',
      reporterId: 'user002',
      teamId: 'team_001',
      reportDate: '2026-08-16',
      submissionTimestamp: beforeBoundary.toISOString(),
      content: 'Yesterday: Task A completed / Today: Task B start / Issue: Resource shortage',
      submissionStatus: 'submitted' as const,
      isMarkedForDeletion: false,
      deletedAt: null as string | null,
    };

    const reportAfterBoundary = {
      reportId: 'report_003',
      reporterId: 'user003',
      teamId: 'team_001',
      reportDate: '2026-08-16',
      submissionTimestamp: afterBoundary.toISOString(),
      content: 'Yesterday: Task A completed / Today: Task B start / Issue: Resource shortage',
      submissionStatus: 'submitted' as const,
      isMarkedForDeletion: false,
      deletedAt: null as string | null,
    };

    const reports = [reportAtBoundary, reportBeforeBoundary, reportAfterBoundary];

    // Act
    const result = await ensureDashboardDataFreshness(
      {
        userId: 'user001',
        teamId: 'team_001',
        reportDate: '2026-08-16',
        maxStalenessSeconds: 300,
      },
      {
        currentTimestamp: now.toISOString(),
        retentionDaysLimit: retentionDays,
        reports: reports,
      }
    );

    // Assert
    expect(result.isDataFresh).toBe(true);
    expect(result.lastUpdateTimestamp).toBeDefined();
    expect(result.displayTimestamp).toBe(now.toISOString());
    expect(result.stalenessSeconds).toBeLessThanOrEqual(300);

    // Verify deletion target marking
    const markedForDeletion = result.deletionMetadata?.markedForDeletion || [];
    const deletedRecords = result.deletionMetadata?.deletedRecords || [];

    // Report at exact boundary should be marked for deletion
    expect(markedForDeletion).toContain('report_001');

    // Reports before and after boundary should NOT be marked for deletion
    expect(markedForDeletion).not.toContain('report_002');
    expect(markedForDeletion).not.toContain('report_003');

    // Verify that marked reports transition to deleted state
    const expectedDeletedCount = 1;
    expect(deletedRecords.length).toBe(expectedDeletedCount);
    expect(deletedRecords).toContain('report_001');
  });
});