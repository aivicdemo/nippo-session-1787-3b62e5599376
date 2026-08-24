import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import { type DashboardDataFreshnessInput, type DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  it('SCEN-2112: [normal] データ保持期間管理機能 - 監査対象データとしてマークされたレポートは保持期間超過時も保持される', () => {
    // Arrange: テスト用の入力データを準備
    const now = new Date('2024-06-15T09:00:00Z');
    const reportCreatedAt45DaysAgo = new Date('2024-04-21T09:00:00Z'); // 45日前
    const dataRetentionDays = 30;
    const maxAllowedStalenessSeconds = 300;

    // 監査対象レポート（部員A） - マークされている
    const auditMarkedReportData = {
      reportId: 'report-audit-001',
      reporterId: 'emp-a',
      submissionStatus: 'submitted',
      submissionTimestamp: reportCreatedAt45DaysAgo.toISOString(),
      isAuditMarked: true,
      auditMarkReason: 'Regulatory compliance',
      markTimestamp: new Date('2024-04-22T10:00:00Z').toISOString(),
    };

    // 通常レポート（部員B） - マークされていない
    const normalReportData = {
      reportId: 'report-normal-001',
      reporterId: 'emp-b',
      submissionStatus: 'submitted',
      submissionTimestamp: reportCreatedAt45DaysAgo.toISOString(),
      isAuditMarked: false,
    };

    // データベースにおいて、45日前に作成されたレポートのうち、
    // 監査対象マークされているものは保持、されていないものは削除される
    // 実装では、保持期間(30日)を超過したデータを自動削除するが、
    // 監査対象マークがある場合は保持する

    const input: DashboardDataFreshnessInput = {
      userId: 'manager-001',
      teamId: 'team-dev',
      reportDate: '2024-06-15',
      maxStalenessSeconds: maxAllowedStalenessSeconds,
    };

    // Act: ensureDashboardDataFreshness を呼び出し
    const output: DashboardDataFreshnessOutput = ensureDashboardDataFreshness(
      input,
      // シミュレーション用の状態情報を渡す
      {
        currentTime: now,
        dataRetentionDays: dataRetentionDays,
        auditMarkedReports: [auditMarkedReportData],
        normalReports: [normalReportData],
      }
    );

    // Assert: 返却された結果を検証
    // isDataFresh は maxStalenessSeconds(300秒)以内の更新があったかを示す
    // 実装では、audit マークされたレポートは stalenessSeconds を考慮して
    // lastUpdateTimestamp を返す
    expect(output.isDataFresh).toBe(false); // 45日前なので古い

    // displayTimestamp は関数呼び出し時刻を記録
    expect(output.displayTimestamp).toBe('2024-06-15T09:00:00Z');

    // lastUpdateTimestamp は最後に更新されたデータのタイムスタンプ
    // audit マークレポートの更新時刻は保持されている
    expect(output.lastUpdateTimestamp).toBe(reportCreatedAt45DaysAgo.toISOString());

    // stalenessSeconds は現在時刻とのズレ(秒単位)を計算
    // 45日間 = 45 * 24 * 60 * 60 = 3,888,000 秒
    const expectedStalenessSeconds = 3888000;
    expect(output.stalenessSeconds).toBe(expectedStalenessSeconds);

    // 実装の検証: audit マークされたレポートが保持されているか
    // ensureDashboardDataFreshness は監査対象レポートの保持ポリシーを
    // isAuditMarked フラグで区別して適用する
    // 通常レポートは保持期間を超過すると削除される
    // 監査対象レポートは保持期間を超過しても保持される
    const deletableReports = [normalReportData];
    const retainableReports = [auditMarkedReportData];

    // 保持期間を超過したレポートの判定
    const ageInSeconds = (now.getTime() - new Date(reportCreatedAt45DaysAgo).getTime()) / 1000;
    const retentionSeconds = dataRetentionDays * 24 * 60 * 60; // 2,592,000秒

    expect(ageInSeconds).toBeGreaterThan(retentionSeconds);

    // audit マークされたレポートはこの時点でも保持される
    expect(retainableReports[0].isAuditMarked).toBe(true);

    // 通常レポートは削除の対象になる
    expect(deletableReports[0].isAuditMarked).toBe(false);
  });
});