import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('データ保持期間管理機能 - 保持期間内の対策計画は削除されない', () => {
  // SCEN-2110
  test('保持期間内（30日 < 60日）の対策計画レコードは削除されず、ステータスと日時が変更されていない', () => {
    // Arrange: テストデータ準備
    const planId = 'PLAN-001';
    const createdAt = '2025-01-20T09:00:00Z';
    const updatedAt = '2025-01-20T09:00:00Z';
    const status = 'active';

    // 本日を2025-02-19 09:00:00とする（作成日から30日経過）
    const currentTimestamp = '2025-02-19T09:00:00Z';
    const currentDate = new Date(currentTimestamp);

    // 保持期間設定: 60日
    const retentionDays = 60;

    // テストデータオブジェクト：保持期間内の対策計画
    const planRecord = {
      plan_id: planId,
      status: status,
      created_at: createdAt,
      updated_at: updatedAt,
    };

    // データベースに存在する複数の対策計画レコード
    const allPlanRecords = [planRecord];

    // Act: データ保持期間管理機能を実行
    const result = ensureDashboardDataFreshness({
      records: allPlanRecords,
      currentDate: currentDate,
      retentionDays: retentionDays,
    });

    // Assert: 保持期間内のレコードは削除されていないことを確認
    expect(result.retained).toContainEqual({
      plan_id: planId,
      status: status,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    // レコードが削除されたグループに含まれていないことを確認
    expect(result.deleted).not.toContainEqual(
      expect.objectContaining({ plan_id: planId })
    );

    // ステータスが変更されていないことを確認
    const retainedRecord = result.retained.find((r) => r.plan_id === planId);
    expect(retainedRecord?.status).toBe('active');

    // 作成日時が変更されていないことを確認
    expect(retainedRecord?.created_at).toBe(createdAt);

    // 更新日時が変更されていないことを確認
    expect(retainedRecord?.updated_at).toBe(updatedAt);
  });
});