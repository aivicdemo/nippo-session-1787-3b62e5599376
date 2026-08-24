import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-2001
  test('ボトルネック変化パターン可視化レポート生成機能 - グラフ形式の自動選択候補がすべて不適切なとき、レポート生成がエラーになる', async () => {
    const analysisStartDate = '2024-12-01T00:00:00Z';
    const analysisEndDate = '2024-12-31T23:59:59Z';
    const recipientManagerId = 'manager-001';

    // TextAnalysisServiceAdapterのスタブ: 低信頼度スコア（0.25未満）を返す
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'APIエラー', frequency: 5, confidenceScore: 0.2 },
          { keyword: 'パフォーマンス低下', frequency: 3, confidenceScore: 0.15 },
        ],
      }),
      assessImpactScore: jest
        .fn()
        .mockResolvedValue({ impactScore: 45, waveSpreadDegree: 'MEDIUM' }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValue({ severity: 'HIGH', reasoning: 'テスト用' }),
    };

    // NotificationServiceAdapterのスタブ（最小実装）
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduledId: 'sched-001' }),
      getDeliveryStatus: jest
        .fn()
        .mockResolvedValue({ delivered: true, timestamp: '2024-12-31T10:00:00Z' }),
    };

    const mockAiClient: Tx8Imp1AiClient = {
      buildAction01Prompt: jest
        .fn()
        .mockResolvedValue('mock-prompt-action-01'),
      callAction01: jest.fn().mockResolvedValue({
        extractedKeywords: ['APIエラー', 'パフォーマンス低下'],
      }),
      buildAction02Prompt: jest
        .fn()
        .mockResolvedValue('mock-prompt-action-02'),
      callAction02: jest.fn().mockResolvedValue({
        timeSeriesAnalysis: [
          { date: '2024-12-01', count: 2 },
          { date: '2024-12-15', count: 3 },
        ],
      }),
      buildAction03Prompt: jest
        .fn()
        .mockResolvedValue('mock-prompt-action-03'),
      callAction03: jest.fn().mockResolvedValue({
        bottleneckPatterns: [
          { pattern: 'INCREASING_TREND', confidence: 0.85 },
        ],
      }),
      buildAction04Prompt: jest
        .fn()
        .mockResolvedValue('mock-prompt-action-04'),
      callAction04: jest.fn().mockResolvedValue({
        // すべてのグラフ形式候補が信頼度閾値（0.3）未満
        graphCandidates: [
          { graphType: 'LINE_CHART', confidence: 0.25 },
          { graphType: 'BAR_CHART', confidence: 0.18 },
          { graphType: 'HEATMAP', confidence: 0.22 },
        ],
      }),
      buildAction05Prompt: jest
        .fn()
        .mockResolvedValue('mock-prompt-action-05'),
      callAction05: jest.fn().mockResolvedValue({
        reportId: 'report-tx8-001',
        graphs: [],
      }),
    };

    // 関数呼び出しと例外検証
    await expect(
      runTx8Imp1Agent(
        {
          analysisStartDate,
          analysisEndDate,
          recipientManagerId,
        },
        mockAiClient,
        mockTextAnalysisServiceAdapter,
        mockNotificationServiceAdapter,
      ),
    ).rejects.toThrow(/グラフ形式/);

    // エラーオブジェクトの構造確認（より詳細な検証が必要な場合）
    try {
      await runTx8Imp1Agent(
        {
          analysisStartDate,
          analysisEndDate,
          recipientManagerId,
        },
        mockAiClient,
        mockTextAnalysisServiceAdapter,
        mockNotificationServiceAdapter,
      );
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      expect(err.code).toBe('ERR_GRAPH_FORMAT_SELECTION_FAILED');
      expect(err.escalationReason).toBe('GRAPH_FORMAT_ALL_INVALID');
      expect(err.failedActionIndex).toBe(4);
      expect(typeof err.auditLogId).toBe('string');
      expect((err.auditLogId as string).startsWith('audit-tx8-')).toBe(true);
    }
  });
});