import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1833
  test('[normal] 月次課題傾向分析レポート生成機能 - レポート生成処理がタイムアウトで失敗した場合、第1回目の再試行が3秒の待機後に実行される', async () => {
    const triggerTimestamp = new Date('2024-01-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'mgr-001';
    const includeDetailedAnalysis = true;

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis,
    };

    // タイムアウトエラーをシミュレートするモックAIクライアント
    let callCount = 0;
    const startTime = Date.now();
    const retryTimestamps: number[] = [];

    const mockAiClient = {
      generateMonthlyAnalysisReport: jest.fn(async () => {
        callCount++;
        if (callCount === 1) {
          // 最初の呼び出しはタイムアウトをシミュレート
          throw new Error('Timeout: Report generation exceeded 30 seconds');
        }
        // 2回目の呼び出し（再試行1回目）は成功を返す
        retryTimestamps.push(Date.now());
        return {
          reportId: 'report-2024-01-001',
          generatedAt: new Date('2024-02-01T10:15:30Z'),
          topPriorityChallenges: [
            {
              challengeId: 'ch-001',
              priorityScore: 85,
              occurrenceFrequency: 5,
              impactLevel: '高',
              resolutionDaysAverage: 3,
            },
            {
              challengeId: 'ch-002',
              priorityScore: 72,
              occurrenceFrequency: 3,
              impactLevel: '中',
              resolutionDaysAverage: 5,
            },
          ],
          bottleneckTrend: {
            timeSeriesData: [
              {
                date: '2024-01-05',
                bottleneckSeverityScore: 65,
              },
              {
                date: '2024-01-15',
                bottleneckSeverityScore: 58,
              },
              {
                date: '2024-01-25',
                bottleneckSeverityScore: 52,
              },
            ],
            improvementTrend: 'improving',
            recurringIssuePattern: ['network_delay', 'database_lock'],
          },
          teamPerformanceMetrics: {
            averageChallengeResolutionDays: 4.2,
            reportSubmissionRate: 0.92,
            challengeReoccurrenceRate: 0.18,
          },
        };
      }),
    };

    // jest.useFakeTimers() でタイマーを制御
    jest.useFakeTimers();

    const executeAgent = async () => {
      const promise = runTx7Imp1Agent(input, mockAiClient as any);
      
      // 最初のタイムアウトエラーを待つ
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 3秒の待機をシミュレート
      jest.advanceTimersByTime(3000);
      
      // 再試行が実行されるのを待つ
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return promise;
    };

    const result: Tx7Imp1AgentOutput = await executeAgent();

    jest.useRealTimers();

    // タイムアウト後、3秒待機、再試行で成功することを確認
    expect(mockAiClient.generateMonthlyAnalysisReport).toHaveBeenCalledTimes(2);
    expect(result.reportId).toBe('report-2024-01-001');
    expect(result.executionStatus).toBe('success');
    expect(result.analysisResultSummary).toBeDefined();
    
    // トップ優先度課題が正確に返されていることを確認
    expect(result.analysisResultSummary.topPriorityChallenges).toHaveLength(2);
    expect(result.analysisResultSummary.topPriorityChallenges[0].challengeId).toBe('ch-001');
    expect(result.analysisResultSummary.topPriorityChallenges[0].priorityScore).toBe(85);
    expect(result.analysisResultSummary.topPriorityChallenges[0].occurrenceFrequency).toBe(5);
    expect(result.analysisResultSummary.topPriorityChallenges[0].impactLevel).toBe('高');
    expect(result.analysisResultSummary.topPriorityChallenges[0].resolutionDaysAverage).toBe(3);

    expect(result.analysisResultSummary.topPriorityChallenges[1].challengeId).toBe('ch-002');
    expect(result.analysisResultSummary.topPriorityChallenges[1].priorityScore).toBe(72);

    // ボトルネック推移分析結果が正確に返されていることを確認
    expect(result.analysisResultSummary.bottleneckTrend.timeSeriesData).toHaveLength(3);
    expect(result.analysisResultSummary.bottleneckTrend.timeSeriesData[0].bottleneckSeverityScore).toBe(65);
    expect(result.analysisResultSummary.bottleneckTrend.timeSeriesData[1].bottleneckSeverityScore).toBe(58);
    expect(result.analysisResultSummary.bottleneckTrend.timeSeriesData[2].bottleneckSeverityScore).toBe(52);
    expect(result.analysisResultSummary.bottleneckTrend.improvementTrend).toBe('improving');
    expect(result.analysisResultSummary.bottleneckTrend.recurringIssuePattern).toContain('network_delay');
    expect(result.analysisResultSummary.bottleneckTrend.recurringIssuePattern).toContain('database_lock');

    // チーム別パフォーマンス指標が正確に返されていることを確認
    expect(result.analysisResultSummary.performanceMetrics.averageChallengeResolutionDays).toBe(4.2);
    expect(result.analysisResultSummary.performanceMetrics.reportSubmissionRate).toBe(0.92);
    expect(result.analysisResultSummary.performanceMetrics.challengeReoccurrenceRate).toBe(0.18);

    // 部長への配信完了日時が記録されていることを確認
    expect(result.deliveryTimestamp).toBeDefined();
    expect(result.deliveryTimestamp).toEqual(expect.any(Date));
  });
});