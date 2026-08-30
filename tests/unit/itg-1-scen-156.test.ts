import { describe, test, expect } from '@jest/globals';
import { archiveOldReports } from '../../src/logic/report-persistence';
import type { ArchiveOldReportsInput } from '../../src/logic/report-persistence';

describe('archiveOldReports', () => {
  // SCEN-156: [error] アーカイブ対象の日報データをアーカイブ領域へ移行する際にデータベース操作が失敗した場合、日報のアーカイブ処理に失敗しました。対象期間: {targetDateRange}、失敗件数: {failedCount}、詳細: {dbErrorDetail}となる
  test('should throw error with specific message when database operation fails during archival', async () => {
    const referenceDateTime = new Date('2024-12-15T10:00:00Z');
    const thirtyDaysBeforeReference = new Date(referenceDateTime.getTime() - 30 * 24 * 60 * 60 * 1000);
    const archiveStorageLocation = '/archive/storage/path';
    const batchSize = 500;
    const verifyDataIntegrity = true;

    const mockArchiveReports = Array.from({ length: 100 }, (_, i) => ({
      reportId: `report-${i + 1}`,
      reportDate: new Date(thirtyDaysBeforeReference.getTime() - i * 24 * 60 * 60 * 1000),
      reporterId: `engineer-${(i % 10) + 1}`,
      teamId: 'team-1',
      submissionTimestamp: new Date(thirtyDaysBeforeReference.getTime() - i * 24 * 60 * 60 * 1000),
      status: 'submitted',
    }));

    const input: ArchiveOldReportsInput = {
      referenceDateTime,
      archiveStorageLocation,
      batchSize,
      verifyDataIntegrity,
    };

    await expect(archiveOldReports(input)).rejects.toThrow(/日報のアーカイブ処理に失敗しました/);
    await expect(archiveOldReports(input)).rejects.toThrow(/対象期間:/);
    await expect(archiveOldReports(input)).rejects.toThrow(/失敗件数:/);
    await expect(archiveOldReports(input)).rejects.toThrow(/詳細:/);
  });
});