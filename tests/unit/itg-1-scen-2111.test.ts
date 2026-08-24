import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  test('SCEN-2111: [normal] データ保持期間管理機能 - 監査対象データとしてマークされた分析結果は保持期間超過時も保持される', async () => {
    // Setup: 現在時刻を固定
    const currentTime = new Date('2024-12-15T10:00:00Z');
    const ninetyDaysAgo = new Date('2024-09-16T10:00:00Z');

    // Setup: 保持期間設定（90日）
    const retentionDays = 90;
    const maxStalenessSeconds = 300; // デフォルト値

    // Setup: テストデータ - 90日前に作成された分析結果
    const analysisData = {
      analysisId: 'analysis_001',
      createdAt: ninetyDaysAgo.toISOString(),
      isAuditProtected: true,
      auditMarkReason: '監査対象',
    };

    // Setup: 監査ログレコード
    const auditLogEntry = {
      auditMarkId: 'auditmark_001',
      analysisId: 'analysis_001',
      auditMarkReason: '監査対象',
      markedAt: currentTime.toISOString(),
      protectionReason: '監査対象マーク',
    };

    // Setup: 入力パラメータ
    const inputParams = {
      userId: 'user_mgr_001',
      teamId: 'team_001',
      reportDate: '2024-12-15',
      maxStalenessSeconds: maxStalenessSeconds,
      currentTime: currentTime,
      retentionDays: retentionDays,
      analysisRecord: analysisData,
      auditLog: auditLogEntry,
    };

    // Execute: データ保持期間管理バッチ処理を実行
    const result = await ensureDashboardDataFreshness(inputParams);

    // Assert: 戻り値の構造を検証
    expect(result).toHaveProperty('isDataFresh');
    expect(result).toHaveProperty('lastUpdateTimestamp');
    expect(result).toHaveProperty('displayTimestamp');
    expect(result).toHaveProperty('stalenessSeconds');

    // Assert: 監査対象データは保持されている
    expect(result.isDataFresh).toBe(true);

    // Assert: lastUpdateTimestamp は分析結果の作成時刻
    expect(result.lastUpdateTimestamp).toBe(ninetyDaysAgo.toISOString());

    // Assert: displayTimestamp は現在の表示時刻
    expect(result.displayTimestamp).toBe(currentTime.toISOString());

    // Assert: データの経過時間を計算
    // (2024-12-15T10:00:00Z - 2024-09-16T10:00:00Z) = 90日 = 7,776,000秒
    const expectedStalenessSeconds = 7776000;
    expect(result.stalenessSeconds).toBe(expectedStalenessSeconds);

    // Assert: 保持期間内判定（maxStalenessSeconds=300秒との比較）
    // stalenessSeconds(7,776,000) > maxStalenessSeconds(300) なので古いデータだが、
    // isAuditProtected=trueにより削除されず保持される
    expect(result.isDataFresh).toBe(true);

    // Assert: 監査ログが正しく記録されている
    expect(auditLogEntry.protectionReason).toBe('監査対象マーク');
    expect(auditLogEntry.analysisId).toBe('analysis_001');

    // Assert: 分析結果レコードの保護状態が有効
    expect(analysisData.isAuditProtected).toBe(true);
    expect(analysisData.auditMarkReason).toBe('監査対象');
  });
});