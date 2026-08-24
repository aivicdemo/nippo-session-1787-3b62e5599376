import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ダッシュボードデータ更新機能 - null データハンドリング', () => {
  // SCEN-1048
  test('今日予定データが null のとき、更新処理がエラーになる', () => {
    // テスト用のダッシュボード入力データを作成
    const input = {
      userId: 'user-001',
      teamId: 'team-dev',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    // スタブ化した NotificationServiceAdapter
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredAt: '2024-01-15T09:00:00Z',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    // スタブ化した TextAnalysisServiceAdapter
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['デバッグ', 'パフォーマンス'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        score: 75,
        level: 'high',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    // ダッシュボード更新時に今日予定データがnullの状態でテスト実行
    expect(() =>
      ensureDashboardDataFreshness(
        input,
        notificationServiceAdapterStub,
        textAnalysisServiceAdapterStub,
        null, // 今日予定データが null
      ),
    ).toThrow(/今日予定/);

    // 外部サービス連携への呼び出しが実行されていないことを検証
    expect(notificationServiceAdapterStub.sendReminderNotification).not.toHaveBeenCalled();
    expect(textAnalysisServiceAdapterStub.extractKeywords).not.toHaveBeenCalled();
    expect(textAnalysisServiceAdapterStub.assessImpactScore).not.toHaveBeenCalled();
    expect(textAnalysisServiceAdapterStub.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});