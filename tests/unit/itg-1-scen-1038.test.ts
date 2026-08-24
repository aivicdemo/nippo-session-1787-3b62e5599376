import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type { DashboardDataFreshnessInput, DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-1038: [error] ダッシュボードデータ更新機能 - 日報データが null のとき、更新処理がエラーになる
  test('should throw ValidationError when dashboard report data is null', async () => {
    const input: DashboardDataFreshnessInput = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered',
        deliveredAt: '2024-01-15T08:30:00Z',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['パフォーマンス', '品質'],
        frequencies: [5, 3],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const reportData = null;

    expect(() =>
      ensureDashboardDataFreshness(input, mockNotificationAdapter, mockTextAnalysisAdapter, reportData)
    ).toThrow(/日報データ/);
  });
});