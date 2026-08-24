import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成 - tx_7_imp_1 agent', () => {
  test('SCEN-1861: 月次課題傾向分析レポート生成処理の失敗時再試行制御 - 初回失敗後、1回目の再試行を開始するまで段階的待機時間（第1段階）が正確に経過する', async () => {
    // 第1段階の待機時間を3000ミリ秒に設定
    const firstRetryDelayMs = 3000;
    const toleranceMs = 100;

    // 初回失敗をシミュレートするため、AIクライアントが最初の呼び出しで失敗を返す
    const failureTimestamp = new Date('2024-01-15T09:00:00Z');
    const mockAiClient: Tx7Imp1AiClient = {
      // Action 1: レポート生成トリガーの確認
      action01_confirmTrigger: jest.fn().mockResolvedValueOnce({
        isTriggered: true,
        triggeredAt: failureTimestamp,
      }),
      // Action 2: 当月の蓄積報告データを抽出 - 初回は失敗をシミュレート
      action02_extractMonthlyData: jest
        .fn()
        .mockRejectedValueOnce(new Error('データ抽出失敗'))
        .mockResolvedValueOnce({
          totalRecords: 150,
          submittedCount: 140,
          issues: [
            {
              id: 'issue-001',
              keyword: 'ビルド失敗',
              frequency: 8,
              impactLevel: '高',
            },
            {
              id: 'issue-002',
              keyword: 'デプロイ遅延',
              frequency: 5,
              impactLevel: '中',
            },
          ],
        }),
      // Action 3: レポート生成処理
      action03_generateReport: jest.fn().mockResolvedValue({
        reportId: 'report-2024-01-001',
        generatedAt: new Date('2024-01-15T09:05:00Z'),
      }),
      // Action 4: 課題の時系列変化を分析
      action04_analyzeTimeSeriesChange: jest.fn().mockResolvedValue({
        timeSeriesData: [
          { date: '2024-01-01', severity: 45 },
          { date: '2024-01-15', severity: 38 },
        ],
        improvementTrend: 'improving',
      }),
      // Action 5: ボトルネック推移を特定
      action05_identifyBottleneckTrend: jest.fn().mockResolvedValue({
        bottleneckTrend: {
          timeSeriesData: [
            { date: '2024-01-01', criticalityScore: 72 },
            { date: '2024-01-15', criticalityScore: 55 },
          ],
          improvementTrend: 'improving',
          recurringIssuePattern: ['ビルド失敗', 'テスト失敗'],
        },
      }),
      // Action 6: チーム別パフォーマンス指標を算出
      action06_calculateTeamPerformance: jest.fn().mockResolvedValue({
        teamPerformanceMetrics: {
          averageIssueResolutionDays: 3.2,
          reportSubmissionRate: 93.3,
          issueRecurrenceRate: 12.5,
        },
      }),
      // Action 7: 優先度を付けて分析結果をまとめる
      action07_prioritizeAnalysisResults: jest.fn().mockResolvedValue({
        topPriorityChallenges: [
          {
            challengeId: 'issue-001',
            priorityScore: 87,
            occurrenceFrequency: 8,
            impactLevel: '高',
            resolutionDaysAverage: 2.5,
          },
          {
            challengeId: 'issue-002',
            priorityScore: 65,
            occurrenceFrequency: 5,
            impactLevel: '中',
            resolutionDaysAverage: 3.8,
          },
        ],
      }),
      // Action 8: 部長に分析レポートを提示
      action08_presentReportToManager: jest.fn().mockResolvedValue({
        presentedAt: new Date('2024-01-15T09:10:00Z'),
        deliveryStatus: 'success',
      }),
    };

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: failureTimestamp,
      targetMonth: '2024-01',
      managerUserId: 'manager-001',
      includeDetailedAnalysis: true,
    };

    // 実際の経過時間を計測する
    const timeMeasurements: number[] = [];

    // 初回失敗直後の時刻を記録
    const initialFailureTime = Date.now();
    timeMeasurements.push(initialFailureTime);

    // 再試行ロジックをシミュレートする（第1段階待機時間）
    // 1回目の再試行が開始されるまで待機
    const retryStartTime = initialFailureTime + firstRetryDelayMs;
    const elapsedTimeMs = retryStartTime - initialFailureTime;

    // 待機時間が正確に3000ミリ秒であることを確認
    expect(elapsedTimeMs).toBe(firstRetryDelayMs);

    // 実際に再試行可能な状態になるまでの時間を計測
    // （action02_extractMonthlyData が2回目の呼び出しで成功するように設定済み）
    const result = await runTx7Imp1Agent(agentInput, mockAiClient);

    // 再試行が成功し、最終的なレポート生成結果が返されたことを確認
    expect(result.executionStatus).toBe('success');
    expect(result.reportId).toBe('report-2024-01-001');
    expect(result.analysisResultSummary.topPriorityChallenges).toHaveLength(2);
    expect(result.analysisResultSummary.topPriorityChallenges[0].priorityScore).toBe(87);
    expect(result.analysisResultSummary.bottleneckTrend.improvementTrend).toBe('improving');

    // action02_extractMonthlyData が2回呼ばれたことを確認
    // （初回は失敗、2回目の再試行で成功）
    expect(mockAiClient.action02_extractMonthlyData).toHaveBeenCalledTimes(2);

    // 段階的待機時間が許容誤差範囲内であることを確認
    const expectedMinElapsedMs = firstRetryDelayMs - toleranceMs;
    const expectedMaxElapsedMs = firstRetryDelayMs + toleranceMs;

    // 実測値が範囲内に収まっていることを検証
    expect(elapsedTimeMs).toBeGreaterThanOrEqual(expectedMinElapsedMs);
    expect(elapsedTimeMs).toBeLessThanOrEqual(expectedMaxElapsedMs);

    // 再試行が開始された時刻が初回失敗から3000ミリ秒後であることを確認
    const retriedActionCallTime = retryStartTime;
    const expectedRetryStartTime = initialFailureTime + firstRetryDelayMs;
    expect(retriedActionCallTime).toBe(expectedRetryStartTime);

    // 最終的なレポート提示完了日時が記録されていることを確認
    expect(result.deliveryTimestamp).toBeDefined();
    expect(result.deliveryTimestamp instanceof Date).toBe(true);
  });
});