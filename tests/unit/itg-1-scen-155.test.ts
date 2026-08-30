import { archiveOldReports, type ArchiveOldReportsOutput } from '../../src/logic/report-persistence';

describe('朝会報告管理システム - レポートアーカイブ処理', () => {
  test('SCEN-155: 30日以上前の日報データを自動検出し、アーカイブ領域に移行して本体テーブルから削除する', () => {
    const referenceDateTime = new Date('2024-01-31T12:00:00Z');
    const archiveStorageLocation = '/archive/reports/2024-01';
    const batchSize = 1000;
    const verifyDataIntegrity = true;

    const oldReportIds = [
      'report-001', 'report-002', 'report-003', 'report-004', 'report-005',
      'report-006', 'report-007', 'report-008', 'report-009', 'report-010'
    ];
    const recentReportIds = [
      'report-011', 'report-012', 'report-013', 'report-014', 'report-015'
    ];

    const mockIdentifyReportsForArchival = jest.fn().mockReturnValue({
      reportIds: oldReportIds,
      totalCount: 10,
      oldestReportDate: new Date('2024-01-01T09:00:00Z')
    });

    const mockEncryptReportData = jest.fn((data) => data);

    const mockBulkUpdateReportStatus = jest.fn().mockReturnValue({
      successCount: 10,
      failureCount: 0,
      failedReportIds: [],
      executedAt: '2024-01-31T12:05:00Z'
    });

    const mockDeleteFromSource = jest.fn().mockResolvedValue(10);

    const mockVerifyDataIntegrity = jest.fn().mockReturnValue(true);

    jest.mock('../../src/logic/report-persistence', () => ({
      identifyReportsForArchival: mockIdentifyReportsForArchival,
      encryptReportData: mockEncryptReportData,
      bulkUpdateReportStatus: mockBulkUpdateReportStatus,
      deleteFromSource: mockDeleteFromSource,
      verifyDataIntegrity: mockVerifyDataIntegrity
    }));

    const result: ArchiveOldReportsOutput = archiveOldReports({
      referenceDateTime,
      archiveStorageLocation,
      batchSize,
      verifyDataIntegrity
    });

    expect(result.archivedReportCount).toBe(10);
    expect(result.deletedFromSourceCount).toBe(10);
    expect(result.archiveExecutionTimestamp).toEqual(expect.any(Date));
    expect(result.dataIntegrityVerified).toBe(true);

    expect(mockIdentifyReportsForArchival).toHaveBeenCalledTimes(1);
    expect(mockIdentifyReportsForArchival).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceDateTime,
        archiveStorageLocation
      })
    );

    expect(mockEncryptReportData).toHaveBeenCalledTimes(1);

    expect(mockBulkUpdateReportStatus).toHaveBeenCalledTimes(1);
    expect(mockBulkUpdateReportStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        reportIdList: oldReportIds,
        newStatus: 'archived'
      })
    );

    expect(mockDeleteFromSource).toHaveBeenCalledTimes(1);
    expect(mockDeleteFromSource).toHaveBeenCalledWith(oldReportIds);

    expect(mockVerifyDataIntegrity).toHaveBeenCalledTimes(1);
  });
});