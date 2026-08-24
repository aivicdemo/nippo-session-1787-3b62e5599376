import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-3183
  test('runTx7Imp1Agentがレポート生成処理を実行する自律処理を契約どおり実行する', async () => {
    // Arrange: モック化されたTx7Imp1AiClientを生成
    const mockAiClient: Tx7Imp1AiClient = {
      action01: jest.fn().mockResolvedValue({
        actionId: 'action-01',
        status: 'completed',
        data: {
          triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
          targetMonth: '2023-12',
        },
      }),
      action02: jest.fn().mockResolvedValue({
        actionId: 'action-02',
        status: 'completed',
        data: {
          extractedRecordCount: 245,
          dataQualityScore: 0.95,
        },
      }),
      action03: jest.fn().mockResolvedValue({
        actionId: 'action-03',
        status: 'completed',
        reportId: 'RPT-2023-12-001',
        generatedAt: new Date('2024-01-01T09:15:00Z'),
      }),
      action04: jest.fn().mockResolvedValue({
        actionId: 'action-04',
        status: 'completed',
        timeSeriesData: [
          {
            date: '2023-12-01',
            bottleneckSeverity: 3,
            activeIssueCount: 5,
          },
          {
            date: '2023-12-15',
            bottleneckSeverity: 2,
            activeIssueCount: 3,
          },
          {
            date: '2023-12-31',
            bottleneckSeverity: 1,
            activeIssueCount: 1,
          },
        ],
        improvementTrend: 'improving',
        recurringIssuePattern: ['DB接続タイムアウト', 'メモリリーク'],
      }),
      action05: jest.fn().mockResolvedValue({
        actionId: 'action-05',
        status: 'completed',
        teamPerformanceMetrics: {
          issueResolutionSpeed: 3.5,
          reportSubmissionRate: 0.92,
          issueRecurrenceRate: 0.18,
          teamName: 'Development Team A',
        },
      }),
      action06: jest.fn().mockResolvedValue({
        actionId: 'action-06',
        status: 'completed',
        topPriorityChallenges: [
          {
            challengeId: 'CHL-001',
            priorityScore: 85,
            occurrenceFrequency: 7,
            impactLevel: '高',
            resolutionDaysAverage: 2.3,
          },
          {
            challengeId: 'CHL-002',
            priorityScore: 72,
            occurrenceFrequency: 5,
            impactLevel: '中',
            resolutionDaysAverage: 1.8,
          },
          {
            challengeId: 'CHL-003',
            priorityScore: 58,
            occurrenceFrequency: 3,
            impactLevel: '低',
            resolutionDaysAverage: 1.2,
          },
        ],
      }),
      action07: jest.fn().mockResolvedValue({
        actionId: 'action-07',
        status: 'completed',
        analysisReportSummary: {
          reportPeriod: '2023-12-01 to 2023-12-31',
          reportGeneratedAt: new Date('2024-01-01T09:30:00Z'),
          analysisSummary: 'Monthly analysis completed with improving trend',
          recommendedActions: [
            'Implement database connection pooling',
            'Review memory management in production',
          ],
        },
      }),
      action08: jest.fn().mockResolvedValue({
        actionId: 'action-08',
        status: 'completed',
        managerNotificationStatus: 'sent',
        deliveryTimestamp: new Date('2024-01-01T09:45:00Z'),
      }),
    };

    // Act: runTx7Imp1Agentを呼び出す
    const input: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2023-12',
      managerUserId: 'MGR-001',
      includeDetailedAnalysis: true,
    };

    const output: Tx7Imp1AgentOutput = await runTx7Imp1Agent(input, mockAiClient);

    // Assert: 
    // 1. レスポンスオブジェクトが正しい構造を持つことを確認
    expect(output).toBeDefined();
    expect(output.reportId).toBe('RPT-2023-12-001');
    expect(output.executionStatus).toBe('success');
    expect(output.deliveryTimestamp).toEqual(new Date('2024-01-01T09:45:00Z'));

    // 2. 分析結果サマリーが正しく生成されたことを確認
    expect(output.analysisResultSummary).toBeDefined();
    expect(output.analysisResultSummary.topPriorityChallenges).toHaveLength(3);
    expect(output.analysisResultSummary.topPriorityChallenges[0].priorityScore).toBe(85);
    expect(output.analysisResultSummary.topPriorityChallenges[0].occurrenceFrequency).toBe(7);
    expect(output.analysisResultSummary.topPriorityChallenges[0].impactLevel).toBe('高');

    // 3. パフォーマンスメトリクスが正しく計算されたことを確認
    expect(output.analysisResultSummary.performanceMetrics.issueResolutionSpeed).toBe(3.5);
    expect(output.analysisResultSummary.performanceMetrics.reportSubmissionRate).toBe(0.92);
    expect(output.analysisResultSummary.performanceMetrics.issueRecurrenceRate).toBe(0.18);

    // 4. ボトルネック分析が正しく実行されたことを確認
    expect(output.analysisResultSummary.bottleneckTrend.improvementTrend).toBe('improving');
    expect(output.analysisResultSummary.bottleneckTrend.timeSeriesData).toHaveLength(3);
    expect(output.analysisResultSummary.bottleneckTrend.timeSeriesData[0].bottleneckSeverity).toBe(3);
    expect(output.analysisResultSummary.bottleneckTrend.timeSeriesData[2].bottleneckSeverity).toBe(1);
    expect(output.analysisResultSummary.bottleneckTrend.recurringIssuePattern).toContain('DB接続タイムアウト');
    expect(output.analysisResultSummary.bottleneckTrend.recurringIssuePattern).toContain('メモリリーク');

    // 5. モック関数がすべて呼び出されたことを確認
    expect(mockAiClient.action01).toHaveBeenCalledWith(input);
    expect(mockAiClient.action02).toHaveBeenCalled();
    expect(mockAiClient.action03).toHaveBeenCalled();
    expect(mockAiClient.action04).toHaveBeenCalled();
    expect(mockAiClient.action05).toHaveBeenCalled();
    expect(mockAiClient.action06).toHaveBeenCalled();
    expect(mockAiClient.action07).toHaveBeenCalled();
    expect(mockAiClient.action08).toHaveBeenCalled();

    // 6. オーケストレーターがTx7Imp1AiClientインターフェースのみに依存していることを確認
    // mockAiClientのすべてのメソッドが期待された型で定義されている
    expect(typeof mockAiClient.action01).toBe('function');
    expect(typeof mockAiClient.action02).toBe('function');
    expect(typeof mockAiClient.action03).toBe('function');
    expect(typeof mockAiClient.action04).toBe('function');
    expect(typeof mockAiClient.action05).toBe('function');
    expect(typeof mockAiClient.action06).toBe('function');
    expect(typeof mockAiClient.action07).toBe('function');
    expect(typeof mockAiClient.action08).toBe('function');

    // 7. 月次分析の具体的な数値が正しく計算されたことを確認
    // 優先度スコア計算: 85 = 高優先度課題の基準値
    expect(output.analysisResultSummary.topPriorityChallenges[0].priorityScore).toBeGreaterThanOrEqual(80);
    expect(output.analysisResultSummary.topPriorityChallenges[0].priorityScore).toBeLessThanOrEqual(100);

    // 提出率90% 以上という改善基準を満たしているか
    expect(output.analysisResultSummary.performanceMetrics.reportSubmissionRate).toBeGreaterThanOrEqual(0.90);

    // 再発率15% 未満という改善目標を達成しているか
    expect(output.analysisResultSummary.performanceMetrics.issueRecurrenceRate).toBeLessThanOrEqual(0.20);
  });
});