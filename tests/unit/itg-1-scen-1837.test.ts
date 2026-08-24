import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成 - 再試行ロジック', () => {
  // SCEN-1837
  test('第2回目の再試行が失敗した場合、第3回目の再試行が30秒の待機後に実行される', async () => {
    jest.useFakeTimers();

    const retryLog: Array<{
      attempt: number;
      status: 'success' | 'failure';
      timestamp: number;
      waitTime?: number;
    }> = [];

    let callCount = 0;
    let secondFailureTimestamp = 0;

    const mockAiClient: Tx7Imp1AiClient = {
      extractKeywordsAction: jest.fn().mockImplementation(async (input) => {
        callCount++;
        const currentTime = Date.now();

        if (callCount === 1) {
          // 1回目: 成功
          retryLog.push({
            attempt: 1,
            status: 'success',
            timestamp: currentTime,
          });
          return {
            keywords: ['データベース接続', 'パフォーマンス低下'],
            frequencies: [5, 3],
          };
        } else if (callCount === 2) {
          // 2回目: 失敗
          secondFailureTimestamp = currentTime;
          retryLog.push({
            attempt: 2,
            status: 'failure',
            timestamp: currentTime,
          });
          const error = new Error('API timeout on second attempt');
          (error as any).code = 'TIMEOUT';
          throw error;
        } else if (callCount === 3) {
          // 3回目: 成功（30秒後）
          const waitTime = currentTime - secondFailureTimestamp;
          retryLog.push({
            attempt: 3,
            status: 'success',
            timestamp: currentTime,
            waitTime,
          });
          return {
            keywords: ['データベース接続', 'パフォーマンス低下', 'メモリリーク'],
            frequencies: [5, 3, 2],
          };
        }
        throw new Error('Unexpected call count');
      }),

      assessImpactScoreAction: jest.fn().mockResolvedValue({
        scores: [85, 65, 45],
      }),

      classifyIssueSeverityAction: jest.fn().mockResolvedValue({
        severities: ['高', '中', '低'],
      }),

      generateTimeSeriesAnalysisAction: jest.fn().mockResolvedValue({
        timeSeriesData: [
          { date: '2024-01-01', bottleneckSeverity: 75 },
          { date: '2024-01-02', bottleneckSeverity: 70 },
        ],
        improvementTrend: 'improving',
      }),

      calculateTeamPerformanceMetricsAction: jest.fn().mockResolvedValue({
        resolutionSpeed: 3.5,
        submissionRate: 0.88,
        recurrenceRate: 0.12,
      }),

      generateMonthlyReportAction: jest.fn().mockResolvedValue({
        reportId: 'REPORT-2024-01-001',
        generatedAt: new Date('2024-01-31T17:30:00Z'),
        topPriorityChallenges: [
          {
            challengeId: 'CH-001',
            priorityScore: 85,
            occurrenceFrequency: 5,
            impactLevel: '高',
            resolutionDaysAverage: 3.5,
          },
        ],
        bottleneckTrend: {
          timeSeriesData: [
            { date: '2024-01-01', bottleneckSeverity: 75 },
          ],
          improvementTrend: 'improving',
          recurringIssuePattern: ['データベース接続'],
        },
        teamPerformanceMetrics: {
          resolutionSpeed: 3.5,
          submissionRate: 0.88,
          recurrenceRate: 0.12,
        },
        emailSentTo: ['manager@example.com'],
        status: 'success',
      }),

      deliverReportAction: jest.fn().mockResolvedValue({
        deliveryId: 'DELIVERY-001',
        deliveryTimestamp: new Date('2024-01-31T17:35:00Z'),
        recipientEmail: 'manager@example.com',
        reportId: 'REPORT-2024-01-001',
        status: 'success',
      }),
    };

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'MGR-12345',
      includeDetailedAnalysis: true,
    };

    // 1回目と2回目の呼び出しは同期実行（第2回目が失敗）
    const executionPromise = runTx7Imp1Agent(input, mockAiClient);

    // 3回目の再試行タイマーが30秒後に発火するようにシミュレート
    await jest.advanceTimersByTimeAsync(30000);

    const result = await executionPromise;

    // 3回の呼び出しが行われたことを確認
    expect(mockAiClient.extractKeywordsAction).toHaveBeenCalledTimes(3);

    // 再試行ログの検証
    expect(retryLog).toHaveLength(3);
    expect(retryLog[0]).toEqual({
      attempt: 1,
      status: 'success',
      timestamp: expect.any(Number),
    });
    expect(retryLog[1]).toEqual({
      attempt: 2,
      status: 'failure',
      timestamp: expect.any(Number),
    });
    expect(retryLog[2]).toEqual({
      attempt: 3,
      status: 'success',
      timestamp: expect.any(Number),
      waitTime: 30000,
    });

    // 3回目の成功を検証
    expect(retryLog[2].waitTime).toBe(30000);
    expect(retryLog[2].status).toBe('success');

    // 最終的なレポート結果を検証
    expect(result.executionStatus).toBe('success');
    expect(result.reportId).toBe('REPORT-2024-01-001');
    expect(result.deliveryTimestamp).toEqual(
      new Date('2024-01-31T17:35:00Z')
    );

    jest.useRealTimers();
  });
});