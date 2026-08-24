import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('Tx7Imp1Agent - 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-3184: [normal] 月次レポート生成から分析完了までの自動実行 AIエージェント
  test('課題の時系列変化を分析する自律処理が契約どおり実行される', async () => {
    // Setup: モック AI クライアントの定義
    const extractedKeywords = [
      { keyword: 'システム障害', frequency: 8 },
      { keyword: '納期遅延', frequency: 6 },
    ];
    const impactScores = {
      'システム障害': 75,
      '納期遅延': 62,
    };
    const previousMonthKeywords = {
      'システム障害': 5,
      '納期遅延': 6,
    };

    const mockAiClient: Tx7Imp1AiClient = {
      confirmReportTrigger: jest.fn().mockResolvedValue({
        triggerConfirmed: true,
        triggerTimestamp: new Date('2024-10-01T09:00:00Z'),
      }),
      extractMonthlyReportData: jest.fn().mockResolvedValue({
        reportRecords: Array.from({ length: 10 }, (_, i) => ({
          reportId: `report-${i + 1}`,
          submittedAt: new Date(`2024-10-${String((i % 28) + 1).padStart(2, '0')}T08:30:00Z`),
          challenges: [
            i % 2 === 0 ? 'システム障害' : '納期遅延',
          ],
        })),
      }),
      generateMonthlyReport: jest.fn().mockResolvedValue({
        reportId: 'report-2024-10',
        generatedAt: new Date('2024-10-01T09:15:00Z'),
        dataQualityScore: 0.92,
      }),
      analyzeTimeSeriesChanges: jest.fn().mockResolvedValue({
        analysisId: 'analysis-001',
        timeSeriesData: [
          {
            keyword: 'システム障害',
            currentMonth: 8,
            previousMonth: 5,
            changePercentage: 60,
            impactScore: 75,
          },
          {
            keyword: '納期遅延',
            currentMonth: 6,
            previousMonth: 6,
            changePercentage: 0,
            impactScore: 62,
          },
        ],
        analysisTimestamp: new Date('2024-10-01T09:20:00Z'),
      }),
      analyzeBottleneckTrend: jest.fn().mockResolvedValue({
        bottleneckTrendId: 'trend-001',
        improvementTrend: 'deteriorating',
        recurringIssuePattern: ['システム障害'],
      }),
      calculateTeamPerformanceMetrics: jest.fn().mockResolvedValue({
        metricsId: 'metrics-001',
        averageResolutionDays: 3.5,
        reportSubmissionRate: 0.88,
        issueRecurrenceRate: 0.15,
      }),
      deliverMonthlyAnalysisReport: jest.fn().mockResolvedValue({
        deliveryId: 'delivery-001',
        deliveryTimestamp: new Date('2024-10-01T09:30:00Z'),
        recipientCount: 1,
      }),
    };

    // Execute: オーケストレーター関数を実行
    const input = {
      triggerTimestamp: new Date('2024-10-01T09:00:00Z'),
      targetMonth: '2024-10',
      managerUserId: 'manager-001',
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    // Verify: Action1 - レポート生成トリガーの確認
    expect(mockAiClient.confirmReportTrigger).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerTimestamp: expect.any(Date),
        targetMonth: '2024-10',
      })
    );

    // Verify: Action2 - 当月データの抽出
    expect(mockAiClient.extractMonthlyReportData).toHaveBeenCalledWith(
      expect.objectContaining({
        targetMonth: '2024-10',
      })
    );

    // Verify: Action3 - レポート生成
    expect(mockAiClient.generateMonthlyReport).toHaveBeenCalled();

    // Verify: Action4 - 課題の時系列変化を分析
    expect(mockAiClient.analyzeTimeSeriesChanges).toHaveBeenCalled();
    const timeSeriesCall = (mockAiClient.analyzeTimeSeriesChanges as jest.Mock).mock.calls[0];
    expect(timeSeriesCall).toBeDefined();
    expect(timeSeriesCall[0]).toHaveProperty('extractedKeywords');
    expect(timeSeriesCall[0]).toHaveProperty('targetMonth', '2024-10');

    // Verify: Action5 - ボトルネック推移の分析
    expect(mockAiClient.analyzeBottleneckTrend).toHaveBeenCalled();

    // Verify: Action6 - チーム別パフォーマンス指標の計算
    expect(mockAiClient.calculateTeamPerformanceMetrics).toHaveBeenCalled();

    // Verify: Action7 - レポート配信
    expect(mockAiClient.deliverMonthlyAnalysisReport).toHaveBeenCalledWith(
      expect.objectContaining({
        managerUserId: 'manager-001',
      })
    );

    // Verify: 時系列分析結果の構造化データ検証
    expect(result).toHaveProperty('executionStatus');
    expect(result).toHaveProperty('analysisResultSummary');
    expect(result.analysisResultSummary).toHaveProperty('bottleneckTrend');

    const bottleneckTrend = result.analysisResultSummary.bottleneckTrend;
    expect(bottleneckTrend).toHaveProperty('timeSeriesData');
    expect(Array.isArray(bottleneckTrend.timeSeriesData)).toBe(true);
    expect(bottleneckTrend.timeSeriesData.length).toBeGreaterThanOrEqual(1);

    // Verify: 具体的な時系列データ検証
    const timeSeriesRecord = bottleneckTrend.timeSeriesData[0];
    expect(timeSeriesRecord).toHaveProperty('keyword');
    expect(timeSeriesRecord).toHaveProperty('currentMonth');
    expect(timeSeriesRecord).toHaveProperty('previousMonth');
    expect(timeSeriesRecord).toHaveProperty('changePercentage');
    expect(timeSeriesRecord).toHaveProperty('impactScore');

    // Verify: 具体的な数値の検証 (システム障害: 前月比60%増加)
    const systemFailureRecord = bottleneckTrend.timeSeriesData.find(
      (r: any) => r.keyword === 'システム障害'
    );
    expect(systemFailureRecord).toBeDefined();
    expect(systemFailureRecord.currentMonth).toBe(8);
    expect(systemFailureRecord.previousMonth).toBe(5);
    expect(systemFailureRecord.changePercentage).toBe(60);
    expect(systemFailureRecord.impactScore).toBe(75);

    // Verify: 納期遅延の検証 (横ばい)
    const delayRecord = bottleneckTrend.timeSeriesData.find(
      (r: any) => r.keyword === '納期遅延'
    );
    expect(delayRecord).toBeDefined();
    expect(delayRecord.currentMonth).toBe(6);
    expect(delayRecord.previousMonth).toBe(6);
    expect(delayRecord.changePercentage).toBe(0);

    // Verify: 分析実行タイムスタンプが記録されていること
    expect(result).toHaveProperty('deliveryTimestamp');
    expect(result.deliveryTimestamp).toBeInstanceOf(Date);

    // Verify: 実行ステータスが成功
    expect(result.executionStatus).toBe('success');

    // Verify: レポートIDが生成されていること
    expect(result).toHaveProperty('reportId');
    expect(result.reportId).toBeTruthy();
  });
});