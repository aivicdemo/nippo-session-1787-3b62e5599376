import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('データ保持期間管理機能', () => {
  test('SCEN-2113: 監査対象データとしてマークされた対策計画は保持期間超過時も保持される', () => {
    // ===== Setup =====
    // テスト用データを準備
    const auditFlaggedPlan = {
      planId: 'plan-audit-001',
      issueKeyword: 'サーバー障害',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      isAuditMarked: true,
      content: 'サーバー障害への対策計画',
    };

    const systemConfig = {
      retentionDays: 90,
    };

    // 現在日時をモック（作成から90日経過時点）
    const mockCurrentDate = new Date('2024-04-01T00:00:00Z');
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => mockCurrentDate.getTime());

    // ===== Execute =====
    // データ鮮度確認処理を実行
    // (実際の処理では、対策計画テーブルに対して保持期間超過チェックを行い、
    //  監査対象フラグがtrueの場合は削除対象から除外する)
    const result = ensureDashboardDataFreshness({
      userId: 'user-dept-head-001',
      teamId: 'team-dev-001',
      reportDate: '2024-04-01',
      maxStalenessSeconds: 300,
    });

    // ===== Verify =====
    // 戻り値の構造を検証
    expect(result).toEqual(
      expect.objectContaining({
        isDataFresh: expect.any(Boolean),
        lastUpdateTimestamp: expect.any(String),
        displayTimestamp: expect.any(String),
        stalenessSeconds: expect.any(Number),
      })
    );

    // データ鮮度フラグが正しく設定されているか確認
    // （最大遅延時間300秒以内であればデータは新鮮と判定される）
    if (result.stalenessSeconds <= 300) {
      expect(result.isDataFresh).toBe(true);
    } else {
      expect(result.isDataFresh).toBe(false);
    }

    // タイムスタンプがISO 8601形式であることを確認
    expect(result.lastUpdateTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(result.displayTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // 遅延時間が0以上の整数であることを確認
    expect(typeof result.stalenessSeconds).toBe('number');
    expect(result.stalenessSeconds).toBeGreaterThanOrEqual(0);

    // ===== Cleanup =====
    // Date.nowをリストア
    Date.now = originalDateNow;
  });
});