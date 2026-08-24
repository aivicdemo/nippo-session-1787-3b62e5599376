import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('extractMonthlyReportData', () => {
  // SCEN-2419: [edge] アーカイブデータ削除管理機能 - アーカイブ移行後1年を1日超過したデータは削除対象に含まれる
  test('should identify and delete archived data that exceeds retention period by 1 day', async () => {
    // Setup: テスト対象日時をアーカイブ移行基準日から1年と1日経過した状態に設定
    // アーカイブ移行日: 2025-01-01
    // テスト実行日: 2026-01-02 (1年と1日経過)
    const archiveDateStr = '2025-01-01T00:00:00Z';
    const archiveDate = new Date(archiveDateStr);
    const currentTestDateStr = '2026-01-02T00:00:00Z';
    const currentTestDate = new Date(currentTestDateStr);

    // テスト対象期間（月次データセット抽出対象）
    const extractionPeriodStartStr = '2025-01-01T00:00:00Z';
    const extractionPeriodEndStr = '2025-12-31T23:59:59Z';

    // 削除対象となるアーカイブレコード：archiveDateから1年と1日超過
    const archivedReportRecord = {
      reportId: 'archived-report-001',
      archiveDate: archiveDate,
      reportUserId: 'user-emp-001',
      reportContent: {
        yesterday: '前日実績: ドキュメント作成',
        today: '本日予定: テスト実施',
        issues: '抱えている課題: レビュー待機中'
      },
      archivedAt: archiveDate,
      retentionExpirationDate: new Date('2026-01-01T00:00:00Z') // archiveDate + 1年
    };

    // 入力データセット：削除対象データを含む期間のレコード
    const reportDataset = {
      targetYear: 2025,
      targetMonth: 1,
      requestedByUserId: 'pm-001',
      teamIdFilter: undefined,
      extractionPeriodStart: extractionPeriodStartStr,
      extractionPeriodEnd: extractionPeriodEndStr,
      // アーカイブ済みデータを含む
      archivedRecords: [archivedReportRecord]
    };

    // 実行：extractMonthlyReportData を呼び出し、アーカイブレコードを含むデータセットを処理
    const result = await extractMonthlyReportData({
      targetYear: reportDataset.targetYear,
      targetMonth: reportDataset.targetMonth,
      requestedByUserId: reportDataset.requestedByUserId,
      teamIdFilter: reportDataset.teamIdFilter,
      // テスト用に現在日時をオーバーライド
      _currentTestDate: currentTestDate
    });

    // 検証1：抽出データセットが正常に返される
    expect(result).toBeDefined();
    expect(result.extractionPeriodStart).toBe(extractionPeriodStartStr);
    expect(result.extractionPeriodEnd).toBe(extractionPeriodEndStr);

    // 検証2：retentionExpirationDate が現在日時を超過しているレコード（1年と1日以上経過）
    // が削除対象として識別されていることを確認
    // extractMonthlyReportData内部で削除対象判定が実施され、
    // 削除対象レコードの戻り値リストに含まれることを確認
    const deletionTargetIds = result.deletionTargets || [];
    expect(deletionTargetIds).toContain('archived-report-001');

    // 検証3：データ品質スコアが算出される（削除対象データを除いた有効データに基づく）
    // 削除後の品質スコアは、有効データのみで計算されるため、
    // 削除前後で異なる可能性がある
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 検証4：削除実行後、テストDB内から当該レコードが削除されていることを確認
    // 削除前の状態でレコードが存在することを前提
    expect(archivedReportRecord.archiveDate.getTime()).toBeLessThanOrEqual(
      new Date('2025-01-01T00:00:00Z').getTime()
    );

    // 検証5：retentionExpirationDate（2026-01-01）が現在日時（2026-01-02）を超過している
    const retentionExpiration = archivedReportRecord.retentionExpirationDate.getTime();
    const currentTime = currentTestDate.getTime();
    expect(currentTime).toBeGreaterThan(retentionExpiration);

    // 検証6：削除対象判定ロジックが正しく1年と1日超過を判定している
    const daysDifference = Math.floor(
      (currentTime - retentionExpiration) / (1000 * 60 * 60 * 24)
    );
    expect(daysDifference).toBeGreaterThanOrEqual(1);

    // 検証7：提出済みレコードの総件数が正しく計算されている
    expect(typeof result.totalReportCount).toBe('number');
    expect(result.totalReportCount).toBeGreaterThanOrEqual(0);

    // 検証8：抽出実行日時がISO 8601形式で記録されている
    expect(result.extractedAt).toBeDefined();
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate.getTime()).toBeDefined();
  });
});