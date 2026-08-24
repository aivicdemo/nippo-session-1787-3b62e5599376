import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-3190: 異常値検出時にエスカレーション条件を発火させ、人による確認待機状態に遷移することを検証
  it('should escalate and pause analysis when anomalous impact score values are detected during Action 5', async () => {
    const triggerTimestamp = new Date('2024-02-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'mgr_001';

    let escalationNotificationSent = false;
    let escalationNotificationContent = '';
    let analysisResultMarkedForReview = false;
    let action8ExecutionAttempted = false;

    const fakeAiClient: Tx7Imp1AiClient = {
      executeAction01: async () => ({
        status: 'success',
        extractedReportDataCount: 42,
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
      }),

      executeAction02: async () => ({
        status: 'success',
        timeSeriesData: [
          { date: '2024-01-01', bottleneckSeverity: 3 },
          { date: '2024-01-08', bottleneckSeverity: 5 },
          { date: '2024-01-15', bottleneckSeverity: 4 },
          { date: '2024-01-22', bottleneckSeverity: 6 },
          { date: '2024-01-29', bottleneckSeverity: 4 },
        ],
      }),

      executeAction03: async () => ({
        status: 'success',
        improvementTrend: 'stable',
        trendDescription: 'ボトルネック深刻度は月間平均4.4で安定',
      }),

      executeAction04: async () => ({
        status: 'success',
        topPriorityChallenges: [
          {
            challengeId: 'ch_001',
            priorityScore: 85,
            occurrenceFrequency: 7,
            impactLevel: '高',
            resolutionDaysAverage: 3,
          },
          {
            challengeId: 'ch_002',
            priorityScore: 62,
            occurrenceFrequency: 4,
            impactLevel: '中',
            resolutionDaysAverage: 5,
          },
        ],
      }),

      executeAction05: async () => {
        // Action 5でチーム波及度スコアが異常値（150、-50など範囲外）を返す
        return {
          status: 'success',
          bottleneckTrendAnalysis: {
            timeSeriesData: [
              { date: '2024-01-01', bottleneckSeverity: 3 },
              { date: '2024-01-08', bottleneckSeverity: 5 },
            ],
            improvementTrend: 'stable',
            recurringIssuePattern: ['API レスポンス遅延', 'DB 接続エラー'],
            anomalyDetected: true,
            anomalousValues: [
              { metric: 'teamWavePropagationScore', value: 150, expectedRange: '0-100' },
              { metric: 'teamWavePropagationScore', value: -50, expectedRange: '0-100' },
            ],
          },
        };
      },

      executeAction06: async () => {
        // Action 6は実行されるべきではない（エスカレーション前に停止）
        throw new Error('Action 6 should not be executed due to escalation');
      },

      executeAction07: async () => {
        // Action 7は実行されるべきではない
        throw new Error('Action 7 should not be executed due to escalation');
      },

      executeAction08: async () => {
        // Action 8は実行されるべきではない
        action8ExecutionAttempted = true;
        throw new Error('Action 8 should not be executed due to escalation');
      },

      notifyEscalation: async (escalationReason: string, details: string) => {
        escalationNotificationSent = true;
        escalationNotificationContent = `${escalationReason}: ${details}`;
        return { status: 'notified', notificationId: 'notif_001' };
      },

      markAnalysisForHumanReview: async (reportId: string) => {
        analysisResultMarkedForReview = true;
        return { reportId, humanReviewRequired: true, status: 'marked_for_review' };
      },

      queryAnalysisStatus: async (reportId: string) => ({
        reportId,
        status: 'awaiting_human_review',
        humanReviewRequired: true,
        completionStatus: 'pending',
      }),
    };

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(agentInput, fakeAiClient);

    // 異常値が検出され、エスカレーション条件が発火したことを確認
    expect(result.executionStatus).toBe('escalation_triggered');

    // エスカレーション通知が送信されたことを確認
    expect(escalationNotificationSent).toBe(true);

    // 通知内容に異常値検出に関する文言が含まれていることを確認
    expect(escalationNotificationContent).toMatch(/異常値検出|範囲外|人による確認/);

    // 分析結果が人による確認が必要な状態に設定されたことを確認
    expect(analysisResultMarkedForReview).toBe(true);

    // Action 8（部長への最終提示）が実行されていないことを確認
    expect(action8ExecutionAttempted).toBe(false);

    // 分析結果ステータスが『awaiting_human_review』であることを確認
    const statusCheck = await fakeAiClient.queryAnalysisStatus(result.reportId);
    expect(statusCheck.status).toBe('awaiting_human_review');
    expect(statusCheck.humanReviewRequired).toBe(true);

    // rollback検証：副作用がまだ確定していないことを確認
    // - 部長への最終報告レポート（Action 8）が実行されていない
    // - 分析結果レコードが『確定待機』状態のままである
    expect(result.executionStatus).not.toBe('success');
    expect(result.deliveryTimestamp).toBeUndefined();
  });
});