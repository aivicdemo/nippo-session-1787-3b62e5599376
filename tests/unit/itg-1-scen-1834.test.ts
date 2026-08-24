import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成機能 - AIエージェント', () => {
  // SCEN-1834
  test('データ抽出エラー時に第1回目の再試行が3秒の待機後に実行される', async () => {
    const triggerTimestamp = new Date('2024-01-01T09:00:00Z');
    const targetMonth = '2023-12';
    const managerUserId = 'manager-001';

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    // 呼び出し履歴を記録するための配列
    const callHistory: { timestamp: Date; callCount: number }[] = [];
    let callAttempt = 0;

    // TextAnalysisServiceAdapterのスタブを定義
    // 第1回目は503エラーを返す、第2回目は正常なレスポンスを返す
    const stubTextAnalysisServiceAdapter: Tx7Imp1AiClient = {
      extractKeywords: async (text: string) => {
        callAttempt++;
        callHistory.push({ timestamp: new Date(), callCount: callAttempt });

        if (callAttempt === 1) {
          // 第1回目: データ抽出エラーをシミュレート
          throw new Error('Service Unavailable (503)');
        } else if (callAttempt === 2) {
          // 第2回目: 正常なレスポンスを返す
          return [
            { keyword: 'database_performance', frequency: 12 },
            { keyword: 'api_latency', frequency: 8 },
            { keyword: 'memory_leak', frequency: 5 },
          ];
        }
        throw new Error('Unexpected call attempt');
      },

      assessImpactScore: async (keyword: string) => {
        return {
          keyword,
          impactScore: 75,
          affectedTeams: ['backend', 'infrastructure'],
        };
      },

      classifyIssueSeverity: async (issueText: string) => {
        return 'high';
      },

      generateAnalysisReport: async (data: object) => {
        return {
          reportId: 'report-2023-12-001',
          timeSeriesData: [
            {
              date: '2023-12-01',
              bottleneckSeverity: 65,
              issueCount: 3,
            },
            {
              date: '2023-12-15',
              bottleneckSeverity: 72,
              issueCount: 5,
            },
            {
              date: '2023-12-31',
              bottleneckSeverity: 68,
              issueCount: 4,
            },
          ],
          improvementTrend: 'stable' as const,
          recurringIssuePattern: ['database_performance', 'api_latency'],
        };
      },
    };

    // 再試行の実際の時間差を計測するための記録
    let firstFailureTimestamp: Date | null = null;
    let firstRetryTimestamp: Date | null = null;

    // 呼び出し履歴を監視してタイムスタンプを記録
    const originalExtractKeywords = stubTextAnalysisServiceAdapter.extractKeywords;
    stubTextAnalysisServiceAdapter.extractKeywords = async (text: string) => {
      const currentTime = new Date();

      if (callAttempt === 0) {
        firstFailureTimestamp = currentTime;
      } else if (callAttempt === 1) {
        firstRetryTimestamp = currentTime;
      }

      return originalExtractKeywords(text);
    };

    // AIエージェントを実行
    const result = await runTx7Imp1Agent(agentInput, stubTextAnalysisServiceAdapter);

    // アサーション: スタブが正確に2回呼び出されたことを確認
    expect(callHistory.length).toBe(2);
    expect(callHistory[0].callCount).toBe(1);
    expect(callHistory[1].callCount).toBe(2);

    // アサーション: 再試行の時間差が3秒±0.5秒の範囲内であることを確認
    if (firstFailureTimestamp && firstRetryTimestamp) {
      const timeDiffMs = firstRetryTimestamp.getTime() - firstFailureTimestamp.getTime();
      const timeDiffSec = timeDiffMs / 1000;

      // 3秒 = 3000ms、許容範囲: 2500ms ～ 3500ms (3秒±0.5秒)
      expect(timeDiffSec).toBeGreaterThanOrEqual(2.5);
      expect(timeDiffSec).toBeLessThanOrEqual(3.5);
    }

    // アサーション: レポート生成が正常に完了したことを確認
    expect(result.executionStatus).toBe('success');
    expect(result.reportId).toBe('report-2023-12-001');
    expect(result.analysisResultSummary).toBeDefined();

    // アサーション: ボトルネック推移の分析結果が含まれていることを確認
    expect(result.analysisResultSummary.bottleneckTrend).toBeDefined();
    expect(result.analysisResultSummary.bottleneckTrend.timeSeriesData).toHaveLength(3);
    expect(result.analysisResultSummary.bottleneckTrend.improvementTrend).toBe('stable');
    expect(result.analysisResultSummary.bottleneckTrend.recurringIssuePattern).toEqual(
      expect.arrayContaining(['database_performance', 'api_latency'])
    );

    // アサーション: パフォーマンス指標が計算されていることを確認
    expect(result.analysisResultSummary.performanceMetrics).toBeDefined();

    // アサーション: 優先度付き課題リストが生成されていることを確認
    expect(result.analysisResultSummary.topPriorityChallenges).toBeDefined();
    expect(Array.isArray(result.analysisResultSummary.topPriorityChallenges)).toBe(true);

    // アサーション: 配信完了タイムスタンプが記録されていることを確認
    expect(result.deliveryTimestamp).toBeInstanceOf(Date);
    expect(result.deliveryTimestamp.getTime()).toBeGreaterThanOrEqual(triggerTimestamp.getTime());
  });
});