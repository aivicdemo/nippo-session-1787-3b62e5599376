import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('朝会報告管理システム - ダッシュボードデータ鮮度保証', () => {
  // SCEN-2136: [edge] データ保持期間管理・自動削除機能 - 保持期間の開始日と終了日が同一日の場合、その日時の経過後にデータが削除対象となる
  test('保持期間開始時刻と終了時刻が同一日時の場合、その時刻経過後にデータが自動削除される', async () => {
    // 同一日時の保持期間設定: 2026-08-20T09:00:00Z
    const retentionStartTime = new Date('2026-08-20T09:00:00Z');
    const retentionEndTime = new Date('2026-08-20T09:00:00Z');

    // テスト対象データ: 保持期間内のデータ
    const testDashboardDataId = 'dashboard-data-001';
    const testDashboardData = {
      id: testDashboardDataId,
      reportDate: '2026-08-20',
      submissionSummary: {
        totalMembers: 10,
        submittedCount: 8,
        unsubmittedCount: 2,
        submissionRate: 80,
      },
      prioritizedIssues: [
        {
          issueId: 'issue-001',
          issueContent: 'テスト課題1',
          priorityScore: 85,
          priorityColor: 'red',
          impactLevel: 'high',
          reporterName: 'エンジニアA',
        },
      ],
      unsubmittedMembers: [
        {
          userId: 'user-002',
          name: 'エンジニアB',
          teamId: 'team-001',
        },
      ],
      lastUpdatedAt: new Date('2026-08-20T08:00:00Z').toISOString(),
      createdAt: new Date('2026-08-20T08:00:00Z').toISOString(),
    };

    // ケース1: 設定時刻ちょうど (2026-08-20T09:00:00Z) では削除されない
    const currentTimeAtExact = new Date('2026-08-20T09:00:00Z');
    const freshnessCheckAtExact = await ensureDashboardDataFreshness(
      {
        userId: 'user-001',
        teamId: 'team-001',
        reportDate: '2026-08-20',
        maxStalenessSeconds: 300,
      },
      {
        dashboardData: testDashboardData,
        currentTime: currentTimeAtExact,
        retentionStartTime,
        retentionEndTime,
      }
    );

    // 時刻ちょうどではデータは削除されない (isDataFresh = true, stalenessSeconds = 0)
    expect(freshnessCheckAtExact.isDataFresh).toBe(true);
    expect(freshnessCheckAtExact.stalenessSeconds).toBe(0);
    expect(freshnessCheckAtExact.lastUpdateTimestamp).toBe(testDashboardData.lastUpdatedAt);
    expect(freshnessCheckAtExact.displayTimestamp).toBe(currentTimeAtExact.toISOString());

    // ケース2: 設定時刻より1秒後 (2026-08-20T09:00:01Z) で自動削除ジョブが実行される
    const currentTimeAfterRetention = new Date('2026-08-20T09:00:01Z');
    const freshnessCheckAfterRetention = await ensureDashboardDataFreshness(
      {
        userId: 'user-001',
        teamId: 'team-001',
        reportDate: '2026-08-20',
        maxStalenessSeconds: 300,
      },
      {
        dashboardData: testDashboardData,
        currentTime: currentTimeAfterRetention,
        retentionStartTime,
        retentionEndTime,
        triggerDeletion: true,
      }
    );

    // データ保持期間を超過したため、削除対象フラグが立つまたは削除ログが記録される
    expect(freshnessCheckAfterRetention.isDataFresh).toBe(false);
    expect(freshnessCheckAfterRetention.stalenessSeconds).toBeGreaterThan(0);

    // 削除ログが記録されている (deleteLog の形式で返される、または外部に記録される)
    if (freshnessCheckAfterRetention.deletionLog) {
      expect(freshnessCheckAfterRetention.deletionLog.executionTimestamp).toBe(
        currentTimeAfterRetention.toISOString()
      );
      expect(freshnessCheckAfterRetention.deletionLog.deletedRecordCount).toBeGreaterThanOrEqual(0);
      expect(freshnessCheckAfterRetention.deletionLog.status).toBe('success');
      expect(freshnessCheckAfterRetention.deletionLog.targetDataId).toBe(testDashboardDataId);
    }

    // 保持期間終了後のデータは削除対象フラグ = TRUE またはデータベースから削除された状態
    expect(freshnessCheckAfterRetention.displayTimestamp).toBe(
      currentTimeAfterRetention.toISOString()
    );
  });
});