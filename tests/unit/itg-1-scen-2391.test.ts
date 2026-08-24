import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 日報データ集約・アーカイブ機能', () => {
  // SCEN-2391: [normal] 日報データ集約・アーカイブ機能 - アーカイブ領域のデータが1年間保持される
  test('should retain archived report data for exactly 365 days and delete data older than 366 days', async () => {
    const now = new Date('2026-08-19T12:00:00Z');
    const retentionDaysPolicy = 365;

    // 365日前のデータ（保持期限内）
    const dataFrom365DaysAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const archivedReportsWithin365Days = Array.from({ length: 10 }, (_, index) => ({
      reportId: `report-within-365-${index + 1}`,
      userId: `user-${index + 1}`,
      teamId: 'team-001',
      reportedDate: dataFrom365DaysAgo.toISOString(),
      content: `Yesterday activity for user ${index + 1}`,
      archivedAt: dataFrom365DaysAgo.toISOString(),
      retentionExpiryDate: new Date(dataFrom365DaysAgo.getTime() + retentionDaysPolicy * 24 * 60 * 60 * 1000).toISOString(),
    }));

    // 366日前のデータ（保持期限超過）
    const dataFrom366DaysAgo = new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000);
    const archivedReportsExpired = Array.from({ length: 10 }, (_, index) => ({
      reportId: `report-expired-${index + 1}`,
      userId: `user-${index + 1}`,
      teamId: 'team-001',
      reportedDate: dataFrom366DaysAgo.toISOString(),
      content: `Yesterday activity for user ${index + 1}`,
      archivedAt: dataFrom366DaysAgo.toISOString(),
      retentionExpiryDate: new Date(dataFrom366DaysAgo.getTime() + retentionDaysPolicy * 24 * 60 * 60 * 1000).toISOString(),
    }));

    // 入力パラメータ：アーカイブテーブル内のすべてのデータと保持ポリシー
    const extractionInput = {
      targetYear: 2026,
      targetMonth: 8,
      requestedByUserId: 'pm-001',
      teamIdFilter: undefined,
      archiveRetentionDays: retentionDaysPolicy,
      currentTimestamp: now,
      allArchivedReports: [...archivedReportsWithin365Days, ...archivedReportsExpired],
    };

    // 関数実行：日報データ集約・アーカイブ保持チェック機能
    const result = await extractMonthlyReportData(extractionInput);

    // 期待結果の検証

    // 1. 保持期限内のデータ（365日前）はアーカイブテーブルに保持されている
    const retainedReportIds = result.retainedArchiveReportIds || [];
    const expectedRetainedCount = 10;
    const actualRetainedCount = retainedReportIds.length;
    expect(actualRetainedCount).toBe(expectedRetainedCount);

    // 保持されるべきレポートIDがすべて含まれている
    archivedReportsWithin365Days.forEach((report) => {
      expect(retainedReportIds).toContain(report.reportId);
    });

    // 2. 保持期限超過のデータ（366日前）はアーカイブテーブルから削除されている
    const deletedReportIds = result.deletedArchiveReportIds || [];
    const expectedDeletedCount = 10;
    const actualDeletedCount = deletedReportIds.length;
    expect(actualDeletedCount).toBe(expectedDeletedCount);

    // 削除されるべきレポートIDがすべて含まれている
    archivedReportsExpired.forEach((report) => {
      expect(deletedReportIds).toContain(report.reportId);
    });

    // 3. 保持期限内のデータと期限超過のデータが混在しないことを確認
    retainedReportIds.forEach((retainedId) => {
      expect(deletedReportIds).not.toContain(retainedId);
    });

    deletedReportIds.forEach((deletedId) => {
      expect(retainedReportIds).not.toContain(deletedId);
    });

    // 4. アーカイブ保持機能の統計情報
    expect(result.archiveRetentionSummary).toBeDefined();
    expect(result.archiveRetentionSummary.retentionPolicyDays).toBe(365);
    expect(result.archiveRetentionSummary.totalRetainedCount).toBe(10);
    expect(result.archiveRetentionSummary.totalDeletedCount).toBe(10);
    expect(result.archiveRetentionSummary.processingTimestamp).toBe(now.toISOString());

    // 5. 保持期限内のデータに対する喪失がないことを確認
    expect(result.archiveRetentionSummary.totalRetainedCount).toBe(expectedRetainedCount);
    expect(retainedReportIds.length).toBe(expectedRetainedCount);

    // 6. 期限超過データのみが削除されていることを確認
    expect(result.archiveRetentionSummary.totalDeletedCount).toBe(expectedDeletedCount);
    expect(deletedReportIds.length).toBe(expectedDeletedCount);
  });
});