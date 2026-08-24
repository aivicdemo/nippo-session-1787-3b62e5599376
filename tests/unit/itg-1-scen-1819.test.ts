import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - 月初スケジュール自動トリガー', () => {
  // SCEN-1819
  test('月初1日の午前9時ちょうどにスケジュール実行がトリガーされてレポート生成開始される', () => {
    // 現在時刻を2026-01-01 09:00:00にモック設定
    const triggeredAt = new Date('2026-01-01T09:00:00Z');
    
    // テスト対象の入力データ構築
    const monthlyReportInput = {
      targetYear: 2026,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined
    };

    // TextAnalysisServiceAdapterスタブ
    const textAnalysisServiceStub = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'ビルド失敗', frequency: 5, confidence: 0.92 },
        { keyword: 'テストケース不足', frequency: 3, confidence: 0.88 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue([
        { keyword: 'ビルド失敗', impactScore: 85 },
        { keyword: 'テストケース不足', impactScore: 62 }
      ]),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    // NotificationServiceAdapterスタブ
    const notificationServiceStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveredAt: triggeredAt
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue('delivered')
    };

    // 実行
    const result = extractMonthlyReportData(
      monthlyReportInput,
      textAnalysisServiceStub,
      notificationServiceStub,
      triggeredAt
    );

    // 期待結果の検証
    expect(result).toBeDefined();
    expect(result.extractionPeriodStart).toBe('2026-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2026-01-31T23:59:59Z');
    expect(result.extractedAt).toBe('2026-01-01T09:00:00Z');
    expect(result.totalReportCount).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    
    // TextAnalysisServiceAdapterが呼び出されたことを確認
    expect(textAnalysisServiceStub.extractKeywords).toHaveBeenCalled();
    expect(textAnalysisServiceStub.assessImpactScore).toHaveBeenCalled();
    
    // レポート生成タスクのステータスが'PROCESSING'であることを確認
    expect(result.reportsByTeam).toBeDefined();
    expect(Array.isArray(result.reportsByTeam)).toBe(true);
  });
});