import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - TextAnalysisServiceAdapter課題キーワード抽出エラー時の再試行', () => {
  // SCEN-2368
  test('課題キーワード抽出が初回失敗したとき、3秒インターバルで1回目の再試行が実行され、2回目呼び出しで成功する', async () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-001';
    const teamIdFilter = ['team-001'];

    const callTimestamps: number[] = [];
    let callCount = 0;

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async () => {
        const callTimeMs = Date.now();
        callTimestamps.push(callTimeMs);
        callCount++;

        if (callCount === 1) {
          // 初回呼び出しは失敗
          throw new Error('API_TIMEOUT: extractKeywords request exceeded 30s');
        }

        // 2回目呼び出しは成功
        return {
          keywords: [
            {
              keyword: 'データベース接続',
              frequency: 1,
              impactScore: 75
            }
          ]
        };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => ({
        impactScore: 75
      })),
      classifyIssueSeverity: jest.fn(async (text: string) => ({
        severity: 'high'
      }))
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async () => ({
        status: 'sent'
      })),
      scheduleNotification: jest.fn(async () => ({
        scheduled: true
      })),
      getDeliveryStatus: jest.fn(async () => ({
        delivered: true
      }))
    };

    const mockReportRecords = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-15T09:00:00Z'),
        teamId: 'team-001',
        userId: 'user-002',
        yesterdayAccomplishments: 'テスト実装完了',
        todayPlans: 'インテグレーションテスト',
        currentIssues: 'データベース接続のタイムアウトが頻発している',
        submissionTime: new Date('2024-01-15T08:55:00Z'),
        isOnTime: true
      }
    ];

    const result = await extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter
      },
      mockTextAnalysisAdapter,
      mockNotificationAdapter,
      mockReportRecords
    );

    // 初回失敗、2回目成功のため、合計2回の呼び出しが記録される
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(2);

    // 2つの呼び出しが存在することを確認
    expect(callTimestamps.length).toBe(2);

    // 2回目の呼び出しが初回より約3秒後に実行されたことを確認（許容値: 2500～3500ms）
    const intervalMs = callTimestamps[1] - callTimestamps[0];
    expect(intervalMs).toBeGreaterThanOrEqual(2500);
    expect(intervalMs).toBeLessThanOrEqual(3500);

    // 抽出結果が正常に返される
    expect(result).toBeDefined();
    expect(result.totalReportCount).toBe(1);
    expect(result.reportsByTeam).toHaveLength(1);
    expect(result.reportsByTeam[0].teamId).toBe('team-001');
    expect(result.reportsByTeam[0].reportCount).toBe(1);

    // キャッシュには保存されず、ダッシュボード表示用に返される
    expect(result.extractedAt).toBeDefined();
    expect(typeof result.extractedAt).toBe('string');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});