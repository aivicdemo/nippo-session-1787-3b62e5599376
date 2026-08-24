import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Archive Data Deletion Management', () => {
  // SCEN-2418: [edge] アーカイブデータ削除管理機能 - アーカイブ移行後1年未満のデータは削除対象に含まれない
  test('should exclude archived data younger than 365 days from deletion list', () => {
    const referenceDate = new Date('2025-01-15T00:00:00Z');
    const thirteenMonthsAgo = new Date('2023-12-15T00:00:00Z');
    const sixMonthsAgo = new Date('2024-07-15T00:00:00Z');
    const oneMonthAgo = new Date('2024-12-15T00:00:00Z');

    const reportDataset = [
      {
        reportId: 'report_001_archived_365_plus',
        teamId: 'team_a',
        reportDate: new Date('2023-12-01T09:00:00Z'),
        archivedDate: thirteenMonthsAgo,
        submissionStatus: 'submitted' as const,
        issues: ['issue_001'],
        dataQualityScore: 85,
      },
      {
        reportId: 'report_002_archived_180_days',
        teamId: 'team_a',
        reportDate: new Date('2024-07-01T09:00:00Z'),
        archivedDate: sixMonthsAgo,
        submissionStatus: 'submitted' as const,
        issues: ['issue_002'],
        dataQualityScore: 82,
      },
      {
        reportId: 'report_003_archived_30_days',
        teamId: 'team_a',
        reportDate: new Date('2024-12-01T09:00:00Z'),
        archivedDate: oneMonthAgo,
        submissionStatus: 'submitted' as const,
        issues: ['issue_003'],
        dataQualityScore: 88,
      },
    ];

    const input = {
      targetYear: 2025,
      targetMonth: 1,
      requestedByUserId: 'user_department_manager',
      teamIdFilter: ['team_a'],
      reportRecords: reportDataset,
      referenceDate: referenceDate,
      archiveRetentionDaysThreshold: 365,
    };

    const result = extractMonthlyReportData(input);

    expect(result).toBeDefined();
    expect(result.totalReportCount).toBe(3);

    const deletionCandidates = reportDataset.filter(report => {
      if (!report.archivedDate) return false;
      const daysSinceArchive = Math.floor(
        (referenceDate.getTime() - report.archivedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceArchive >= 365;
    });

    expect(deletionCandidates).toHaveLength(1);
    expect(deletionCandidates[0].reportId).toBe('report_001_archived_365_plus');

    const nonDeletionCandidates = reportDataset.filter(report => {
      if (!report.archivedDate) return false;
      const daysSinceArchive = Math.floor(
        (referenceDate.getTime() - report.archivedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceArchive < 365;
    });

    expect(nonDeletionCandidates).toHaveLength(2);
    expect(nonDeletionCandidates.map(r => r.reportId)).toEqual([
      'report_002_archived_180_days',
      'report_003_archived_30_days',
    ]);
  });
});