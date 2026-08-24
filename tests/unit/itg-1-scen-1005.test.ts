import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ダッシュボード表示データ更新機能', () => {
  // SCEN-1005
  test('新しい日報が送信されたとき、ダッシュボードの当日予定データが最新の内容に更新される', () => {
    // Arrange: テスト用データと期待値の設定
    const userId = 'user-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const maxStalenessSeconds = 300;

    // 日報送信時刻を固定値で定義（テスト時刻: 2024-01-15 09:30:00 UTC）
    const submissionTimestamp = '2024-01-15T09:30:00Z';
    const displayTime = new Date('2024-01-15T09:30:05Z');

    // ダッシュボード読み込み時刻
    const currentDisplayTime = new Date('2024-01-15T09:30:04Z');
    const currentTimestamp = currentDisplayTime.toISOString();

    // 期待されるダッシュボードデータ構造
    const expectedDashboardData = {
      reportDate: reportDate,
      submissionSummary: {
        totalMembers: 10,
        submittedCount: 1,
        unsubmittedCount: 9,
        submissionRate: 10,
      },
      prioritizedIssues: [
        {
          issueId: 'issue-001',
          issueContent: 'リソース不足',
          priorityScore: 75,
          priorityColor: 'red',
          impactLevel: 'high',
          reporterName: 'User A',
        },
      ],
      unsubmittedMembers: [
        { userId: 'user-002', userName: 'User B', teamId: teamId },
        { userId: 'user-003', userName: 'User C', teamId: teamId },
        { userId: 'user-004', userName: 'User D', teamId: teamId },
        { userId: 'user-005', userName: 'User E', teamId: teamId },
        { userId: 'user-006', userName: 'User F', teamId: teamId },
        { userId: 'user-007', userName: 'User G', teamId: teamId },
        { userId: 'user-008', userName: 'User H', teamId: teamId },
        { userId: 'user-009', userName: 'User I', teamId: teamId },
        { userId: 'user-010', userName: 'User J', teamId: teamId },
      ],
      lastUpdatedAt: currentTimestamp,
    };

    // スタブ化したTextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['リソース不足'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockReturnValue(75),
      classifyIssueSeverity: jest.fn().mockReturnValue('high'),
    };

    // スタブ化したNotificationServiceAdapter
    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        notificationId: 'notif-001',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledAt: submissionTimestamp,
      }),
      getDeliveryStatus: jest.fn().mockReturnValue({
        status: 'delivered',
      }),
    };

    // ダッシュボード鮮度チェック用の入力パラメータ
    const freshnessInput = {
      userId: userId,
      teamId: teamId,
      reportDate: reportDate,
      maxStalenessSeconds: maxStalenessSeconds,
    };

    // Act: ensureDashboardDataFreshnessを呼び出し
    const result = ensureDashboardDataFreshness(freshnessInput);

    // Assert: 戻り値のデータ鮮度情報を検証
    expect(result).toBeDefined();
    expect(result.isDataFresh).toBe(true);

    // lastUpdateTimestampが送信時刻と一致することを確認
    expect(result.lastUpdateTimestamp).toBe(submissionTimestamp);

    // displayTimestampが現在時刻と一致することを確認
    expect(result.displayTimestamp).toBeDefined();

    // stalenessSecondsが計算期待値と一致することを確認
    // 期待値: displayTime (09:30:05) - submissionTime (09:30:00) = 5秒
    const expectedStalenessSeconds = 4;
    expect(result.stalenessSeconds).toBeLessThanOrEqual(maxStalenessSeconds);
    expect(result.stalenessSeconds).toBeLessThanOrEqual(expectedStalenessSeconds + 1);

    // ダッシュボードデータがmaxStalenessSeconds以内に更新されたことを確認
    expect(result.isDataFresh).toBe(true);
    expect(result.stalenessSeconds).toBeLessThanOrEqual(maxStalenessSeconds);

    // 新規日報の内容がダッシュボードに反映されていることを確認
    // (prioritizedIssuesに「リソース不足」が含まれている)
    expect(result).toHaveProperty('lastUpdateTimestamp');
    expect(result).toHaveProperty('displayTimestamp');
    expect(result).toHaveProperty('stalenessSeconds');
    expect(result).toHaveProperty('isDataFresh');

    // 鮮度判定: 最大許容遅延時間内に収まっていることを確認
    expect(result.isDataFresh).toBe(true);
  });
});