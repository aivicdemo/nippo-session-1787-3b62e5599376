import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Report Data Extraction - Archive Idempotency', () => {
  // SCEN-2396
  test('同じ集約期間指示で複数回実行した場合、同じアーカイブ結果が得られる', async () => {
    const aggregationStartDate = new Date('2026-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2026-01-31T23:59:59Z');

    // 初期テストデータ：2026年1月の日報レコード
    const testReportRecords = [
      {
        reportId: 'report-001',
        userId: 'user-001',
        teamId: 'team-001',
        reportDate: new Date('2026-01-05T08:30:00Z'),
        yesterdayAccomplishment: '前日実装: 認証機能の実装完了',
        todayPlan: '本日予定: ユーザー管理画面の実装',
        issueDescription: '課題: DB接続タイムアウトの改善が必要',
        submittedAt: new Date('2026-01-05T08:45:00Z'),
      },
      {
        reportId: 'report-002',
        userId: 'user-002',
        teamId: 'team-001',
        reportDate: new Date('2026-01-06T08:30:00Z'),
        yesterdayAccomplishment: '前日実装: ダッシュボードUIの完成',
        todayPlan: '本日予定: テストケース作成',
        issueDescription: '課題: API仕様の確認待ち',
        submittedAt: new Date('2026-01-06T08:50:00Z'),
      },
      {
        reportId: 'report-003',
        userId: 'user-001',
        teamId: 'team-001',
        reportDate: new Date('2026-01-07T08:30:00Z'),
        yesterdayAccomplishment: '前日実装: ユーザー管理画面の実装',
        todayPlan: '本日予定: 権限管理機能の実装',
        issueDescription: '課題: セキュリティレビュー待ち',
        submittedAt: new Date('2026-01-07T08:55:00Z'),
      },
    ];

    // 1回目の実行
    const firstExecutionResult = await extractMonthlyReportData({
      aggregationStartDate,
      aggregationEndDate,
      reportRecords: testReportRecords,
    });

    // 1回目の結果を記録
    const firstArchiveFileName = firstExecutionResult.archiveFileName;
    const firstRecordCount = firstExecutionResult.recordCount;
    const firstChecksum = firstExecutionResult.checksum;
    const firstExtractedAt = firstExecutionResult.extractedAt;

    // 1回目の検証：レコード数
    expect(firstRecordCount).toBe(3);

    // 1回目の検証：アーカイブ内容
    expect(firstExecutionResult.archivedRecords).toHaveLength(3);
    expect(firstExecutionResult.archivedRecords[0]).toMatchObject({
      reportId: 'report-001',
      userId: 'user-001',
      yesterdayAccomplishment: '前日実装: 認証機能の実装完了',
      todayPlan: '本日予定: ユーザー管理画面の実装',
      issueDescription: '課題: DB接続タイムアウトの改善が必要',
    });
    expect(firstExecutionResult.archivedRecords[1]).toMatchObject({
      reportId: 'report-002',
      userId: 'user-002',
      yesterdayAccomplishment: '前日実装: ダッシュボードUIの完成',
      todayPlan: '本日予定: テストケース作成',
      issueDescription: '課題: API仕様の確認待ち',
    });
    expect(firstExecutionResult.archivedRecords[2]).toMatchObject({
      reportId: 'report-003',
      userId: 'user-001',
      yesterdayAccomplishment: '前日実装: ユーザー管理画面の実装',
      todayPlan: '本日予定: 権限管理機能の実装',
      issueDescription: '課題: セキュリティレビュー待ち',
    });

    // 2回目の実行（同じパラメータで）
    const secondExecutionResult = await extractMonthlyReportData({
      aggregationStartDate,
      aggregationEndDate,
      reportRecords: testReportRecords,
    });

    // 2回目の結果を記録
    const secondArchiveFileName = secondExecutionResult.archiveFileName;
    const secondRecordCount = secondExecutionResult.recordCount;
    const secondChecksum = secondExecutionResult.checksum;
    const secondExtractedAt = secondExecutionResult.extractedAt;

    // 1回目と2回目の比較検証：(1)アーカイブ内のレコード件数が同一
    expect(firstRecordCount).toBe(secondRecordCount);
    expect(secondRecordCount).toBe(3);

    // 1回目と2回目の比較検証：(2)各日報の「昨日やったこと」「今日やること」「抱えている課題」が完全に同一
    expect(firstExecutionResult.archivedRecords[0].yesterdayAccomplishment).toBe(
      secondExecutionResult.archivedRecords[0].yesterdayAccomplishment,
    );
    expect(firstExecutionResult.archivedRecords[0].todayPlan).toBe(
      secondExecutionResult.archivedRecords[0].todayPlan,
    );
    expect(firstExecutionResult.archivedRecords[0].issueDescription).toBe(
      secondExecutionResult.archivedRecords[0].issueDescription,
    );

    expect(firstExecutionResult.archivedRecords[1].yesterdayAccomplishment).toBe(
      secondExecutionResult.archivedRecords[1].yesterdayAccomplishment,
    );
    expect(firstExecutionResult.archivedRecords[1].todayPlan).toBe(
      secondExecutionResult.archivedRecords[1].todayPlan,
    );
    expect(firstExecutionResult.archivedRecords[1].issueDescription).toBe(
      secondExecutionResult.archivedRecords[1].issueDescription,
    );

    expect(firstExecutionResult.archivedRecords[2].yesterdayAccomplishment).toBe(
      secondExecutionResult.archivedRecords[2].yesterdayAccomplishment,
    );
    expect(firstExecutionResult.archivedRecords[2].todayPlan).toBe(
      secondExecutionResult.archivedRecords[2].todayPlan,
    );
    expect(firstExecutionResult.archivedRecords[2].issueDescription).toBe(
      secondExecutionResult.archivedRecords[2].issueDescription,
    );

    // 1回目と2回目の比較検証：(3)日報の格納順序が同一
    expect(firstExecutionResult.archivedRecords.map((r) => r.reportId)).toEqual(
      secondExecutionResult.archivedRecords.map((r) => r.reportId),
    );
    expect(firstExecutionResult.archivedRecords.map((r) => r.userId)).toEqual(
      secondExecutionResult.archivedRecords.map((r) => r.userId),
    );

    // 1回目と2回目の比較検証：(4)タイムスタンプを除いたアーカイブファイルの全バイナリデータが同一（チェックサム値が一致）
    expect(firstChecksum).toBe(secondChecksum);

    // 追加検証：アーカイブファイル名の形式確認
    expect(firstArchiveFileName).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z_monthly_archive\.zip$/);
    expect(secondArchiveFileName).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z_monthly_archive\.zip$/);
  });
});