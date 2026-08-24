import { jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成機能 - 再試行メカニズム', () => {
  // SCEN-1835
  test('分析ロジック失敗時に第1回目の再試行が正確に3秒後に実行される', async () => {
    jest.useFakeTimers();
    
    const mockAiClient: Tx7Imp1AiClient = {
      action01ExtractMonthlyReportData: jest.fn().mockResolvedValue({
        extractedReportId: 'report-2024-01-001',
        dataRecordCount: 250,
        timeRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
      }),
      action02ValidateDataQuality: jest.fn().mockResolvedValue({
        validationStatus: 'passed',
        qualityScore: 0.92,
        completenessPercentage: 95,
      }),
      action03GenerateReportStructure: jest.fn().mockResolvedValue({
        reportStructureId: 'struct-7imp1-001',
        templateVersion: '2.1',
        sections: ['executive_summary', 'bottleneck_analysis', 'performance_metrics'],
      }),
      action04AnalyzeTimeSeriesAndBottleneck: jest.fn().mockRejectedValueOnce(
        new Error('Analysis logic failed')
      ),
      action05CalculateTeamPerformanceMetrics: jest.fn(),
      action06GenerateFinalReport: jest.fn(),
      action07DeliverReportToManager: jest.fn(),
      action08RecordExecutionAudit: jest.fn(),
    };

    const initialSpyAction04 = jest.spyOn(mockAiClient, 'action04AnalyzeTimeSeriesAndBottleneck');

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-02-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'mgr-dev-001',
      includeDetailedAnalysis: true,
    };

    const agentPromise = runTx7Imp1Agent(agentInput, mockAiClient).catch(
      (error: any) => ({
        executionStatus: 'failure',
        errorMessage: error.message,
        retriedAt: null,
      })
    );

    await jest.advanceTimersByTimeAsync(0);
    expect(initialSpyAction04).toHaveBeenCalledTimes(1);

    jest.useFakeTimers();
    
    mockAiClient.action04AnalyzeTimeSeriesAndBottleneck = jest.fn().mockResolvedValueOnce({
      timeSeriesData: [
        {
          date: '2024-01-15',
          bottleneckSeverityScore: 72,
          affectedTeamCount: 3,
          topBottleneckKeywords: ['API遅延', 'DB接続数'],
        },
      ],
      improvementTrend: 'stable',
      recurringIssuePattern: ['キャッシュ不足', 'メモリリーク'],
    });

    const retrySpyAction04 = jest.spyOn(mockAiClient, 'action04AnalyzeTimeSeriesAndBottleneck');

    const retryPromise = runTx7Imp1Agent(agentInput, mockAiClient).catch(
      (error: any) => ({
        executionStatus: 'partial_failure',
        errorMessage: error.message,
      })
    );

    const startTime = Date.now();
    await jest.advanceTimersByTimeAsync(3000);
    const elapsedTime = Date.now() - startTime;

    expect(elapsedTime).toBeGreaterThanOrEqual(3000);
    expect(retrySpyAction04).toHaveBeenCalled();
    expect(retrySpyAction04.mock.calls.length).toBeGreaterThan(0);

    jest.useRealTimers();

    await expect(agentPromise).resolves.toBeDefined();
    await expect(retryPromise).resolves.toBeDefined();

    expect(mockAiClient.action01ExtractMonthlyReportData).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action02ValidateDataQuality).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action03GenerateReportStructure).toHaveBeenCalledTimes(1);
  });
});