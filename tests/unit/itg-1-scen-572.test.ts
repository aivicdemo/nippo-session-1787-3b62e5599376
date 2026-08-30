import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';
import { type IssueRetentionPolicy, type IssueRetentionResult } from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence - Archive and Retention Management', () => {
  // SCEN-572: [edge] 指定された保持期間ルールに基づいて、古い課題データをアーカイブ領域に移行し、期限満了データを削除する。 - 日報レコードが存在しないときという明示された境界条件で指定された期間内に日報レコードが見つかりません
  test('should complete successfully with zero counts when no issue data exists in the specified period', () => {
    const mockIdentifyIssueDataForArchival = jest.fn().mockResolvedValue([]);
    const mockIdentifyArchivedIssueDataForDeletion = jest.fn().mockResolvedValue([]);
    const mockRecordIssueAuditLog = jest.fn().mockResolvedValue(undefined);
    const mockLogWarning = jest.fn();

    const retentionPolicy: IssueRetentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: [],
      aggregationPeriodStart: '2025-01-01',
      aggregationPeriodEnd: '2025-01-31',
    };

    const fixedTimestamp = new Date('2025-02-01T10:00:00Z').toISOString();
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date(fixedTimestamp).getTime());

    const result = archiveAndManageIssueDataRetention(
      retentionPolicy,
      mockIdentifyIssueDataForArchival,
      mockIdentifyArchivedIssueDataForDeletion,
      mockRecordIssueAuditLog,
      mockLogWarning,
    );

    expect(result).toEqual<IssueRetentionResult>({
      archivedCount: 0,
      deletedCount: 0,
      protectedCount: 0,
      executionTimestamp: fixedTimestamp,
    });

    expect(mockLogWarning).toHaveBeenCalledWith(expect.stringMatching(/日報レコードが見つかりません/));
    expect(mockIdentifyIssueDataForArchival).toHaveBeenCalled();
    expect(mockIdentifyArchivedIssueDataForDeletion).toHaveBeenCalled();
    expect(mockRecordIssueAuditLog).not.toHaveBeenCalled();

    dateNowSpy.mockRestore();
  });
});