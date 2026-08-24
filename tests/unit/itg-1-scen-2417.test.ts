import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('monthly-performance-analysis: extractMonthlyReportData', () => {
  // SCEN-2417: [edge] アーカイブデータ削除管理機能 - アーカイブ移行後ちょうど1年経過したデータは削除対象に含まれる
  test('should identify archived reports for deletion when exactly 1 year has elapsed since archival date', () => {
    // Setup: Current date/time set to 2025-01-15T12:00:00Z
    const currentDateTime = new Date('2025-01-15T12:00:00Z');

    // Test data: Archive records with different archival dates
    const archiveRecord001 = {
      reportId: 'ARCHIVE-001',
      archivalDate: new Date('2024-01-15T00:00:00Z'), // Exactly 1 year before current date
      reporterId: 'member001',
      reportContent: 'Yesterday: Completed Task A, Today: Starting Task B, Issues: None',
    };

    const archiveRecord002 = {
      reportId: 'ARCHIVE-002',
      archivalDate: new Date('2024-01-14T00:00:00Z'), // More than 1 year before current date (1 day over)
      reporterId: 'member002',
      reportContent: 'Yesterday: Attended meeting, Today: Preparing documents, Issues: Resource shortage',
    };

    const archiveRecord003 = {
      reportId: 'ARCHIVE-003',
      archivalDate: new Date('2024-01-16T00:00:00Z'), // Less than 1 year before current date (1 day short)
      reporterId: 'member003',
      reportContent: 'Yesterday: Conducted review, Today: Applying fixes, Issues: Schedule delay',
    };

    const archiveRecords = [archiveRecord001, archiveRecord002, archiveRecord003];

    // Execution: Run deletion target judgment logic with archival threshold of 1 year
    const result = extractMonthlyReportData(
      {
        targetYear: 2025,
        targetMonth: 1,
        requestedByUserId: 'user-admin',
      },
      archiveRecords,
      currentDateTime
    );

    // Validation: Verify deletion target determination
    // Records with archival date >= 1 year before current date should be marked for deletion
    const deletionTargetIds = result.recordsMarkedForDeletion.map((rec) => rec.reportId);

    // ARCHIVE-001: archival date exactly 1 year before -> should be deletion target
    expect(deletionTargetIds).toContain('ARCHIVE-001');

    // ARCHIVE-002: archival date 1 day more than 1 year before -> should be deletion target
    expect(deletionTargetIds).toContain('ARCHIVE-002');

    // ARCHIVE-003: archival date 1 day less than 1 year before -> should NOT be deletion target
    expect(deletionTargetIds).not.toContain('ARCHIVE-003');

    // Additional validations on result structure
    expect(result.recordsMarkedForDeletion.length).toBe(2);
    expect(result.recordsExcludedFromDeletion.length).toBe(1);
    expect(result.recordsExcludedFromDeletion[0].reportId).toBe('ARCHIVE-003');

    // Verify exact archival dates are preserved in output
    const archive001InDeletion = result.recordsMarkedForDeletion.find(
      (rec) => rec.reportId === 'ARCHIVE-001'
    );
    expect(archive001InDeletion).toBeDefined();
    expect(archive001InDeletion?.archivalDate).toEqual(new Date('2024-01-15T00:00:00Z'));

    const archive002InDeletion = result.recordsMarkedForDeletion.find(
      (rec) => rec.reportId === 'ARCHIVE-002'
    );
    expect(archive002InDeletion).toBeDefined();
    expect(archive002InDeletion?.archivalDate).toEqual(new Date('2024-01-14T00:00:00Z'));

    const archive003InExcluded = result.recordsExcludedFromDeletion.find(
      (rec) => rec.reportId === 'ARCHIVE-003'
    );
    expect(archive003InExcluded).toBeDefined();
    expect(archive003InExcluded?.archivalDate).toEqual(new Date('2024-01-16T00:00:00Z'));
  });
});