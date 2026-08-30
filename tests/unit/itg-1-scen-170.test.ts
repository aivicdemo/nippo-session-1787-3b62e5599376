import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';
import { type IssueRetentionPolicy, type IssueRetentionResult } from '../../src/logic/issue-data-persistence';

describe('朝会報告管理システム - 課題データ保持ルール管理', () => {
  test('SCEN-170: 指定された保持期間ルールに基づいて、古い課題データをアーカイブ領域に移行し、期限満了データを削除する', () => {
    // Arrange: テスト用の IssueRetentionPolicy オブジェクトを作成
    const retentionPolicy: IssueRetentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: ['audit_required', 'executive_reference'],
      aggregationPeriodStart: '2024-01-01T00:00:00Z',
      aggregationPeriodEnd: '2024-01-31T23:59:59Z',
    };

    // Act: archiveAndManageIssueDataRetention 処理を実行
    const result: IssueRetentionResult = archiveAndManageIssueDataRetention(retentionPolicy);

    // Assert: 戻り値の IssueRetentionResult オブジェクトを検証
    // archivedCount: identifyIssueDataForArchival から返された 50 件が完全にアーカイブ領域に移行
    expect(result.archivedCount).toBe(50);

    // deletedCount: identifyArchivedIssueDataForDeletion から返された 30 件のうち、
    // protectedDataCategories 保護対象 5 件を除いた 25 件が削除
    expect(result.deletedCount).toBe(25);

    // protectedCount: audit_required または executive_reference 分類の課題データ 5 件が保持ルールにより保護
    expect(result.protectedCount).toBe(5);

    // executionTimestamp が ISO 8601 形式で記録されていることを確認
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 戻り値の型チェック（フィールドが存在することを確認）
    expect(typeof result.archivedCount).toBe('number');
    expect(typeof result.deletedCount).toBe('number');
    expect(typeof result.protectedCount).toBe('number');
    expect(typeof result.executionTimestamp).toBe('string');
  });
});