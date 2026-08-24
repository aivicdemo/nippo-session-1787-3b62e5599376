import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-3191: [error] 月次レポート生成から分析完了までの自動実行 AIエージェント - 「月次レポート生成から分析完了までの自動実行」が「分析結果が過去の傾向と大きく乖離した場合」の場合に副作用の確定前に人へ引き継ぐ
  test('should escalate to human review when analysis result deviates significantly from historical trend', async () => {
    const triggerTimestamp = new Date('2024-02-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'manager-001';

    // Mock AI client that simulates significant performance deviation
    const mockAiClient: Tx7Imp1AiClient = {
      async action01_confirmReportGenerationTrigger() {
        return { triggerDetected: true, triggeredAt: triggerTimestamp };
      },

      async action02_extractAccumulatedReportData() {
        return {
          datasetId: 'dataset-2024-01',
          reportCount: 10,
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
          extractedAt: new Date('2024-02-01T09:05:00Z'),
        };
      },

      async action03_executeReportGeneration() {
        return {
          reportId: 'report-2024-01-001',
          generatedAt: new Date('2024-02-01T09:10:00Z'),
          reportStatus: 'generated',
        };
      },

      async action04_analyzeTimeSeriesChange() {
        return {
          timeSeriesData: [
            { date: '2024-01-01', bottleneckSeverity: 65 },
            { date: '2024-01-15', bottleneckSeverity: 58 },
            { date: '2024-01-31', bottleneckSeverity: 48 },
          ],
          changePattern: 'improving_trend',
        };
      },

      async action05_identifyBottleneckTrend() {
        return {
          improvementTrend: 'deteriorating',
          recurringIssuePattern: ['DB performance', 'API latency'],
          trendAnalysis: 'unexpected_regression',
        };
      },

      async action06_calculateTeamPerformanceMetrics() {
        // Previous average performance score for 12 months: 72
        // Current analysis performance score: 39.6 (representing -45% deviation)
        return {
          teamPerformanceMetrics: {
            issueResolutionSpeed: 2.1,
            reportSubmissionRate: 0.88,
            issueRecurrenceRate: 0.32,
            overallPerformanceScore: 39.6,
            previousAveragePerfScore: 72,
          },
        };
      },

      async action07_prioritizeAndSummarizeAnalysis() {
        // Return analysis result with significant deviation flag
        const deviationPercentage = ((39.6 - 72) / 72) * 100; // -45%
        return {
          analysisResultSummary: {
            topPriorityChallenges: [
              {
                challengeId: 'challenge-001',
                priorityScore: 95,
                occurrenceFrequency: 8,
                impactLevel: 'high',
                resolutionDaysAverage: 5.2,
              },
            ],
            performanceMetrics: {
              issueResolutionSpeed: 2.1,
              reportSubmissionRate: 0.88,
              issueRecurrenceRate: 0.32,
              overallPerformanceScore: 39.6,
            },
            bottleneckTrend: {
              timeSeriesData: [
                { date: '2024-01-01', bottleneckSeverity: 65 },
                { date: '2024-01-31', bottleneckSeverity: 48 },
              ],
              improvementTrend: 'deteriorating',
              recurringIssuePattern: ['DB performance', 'API latency'],
            },
          },
          detectedDeviation: {
            isSignificantDeviation: true,
            deviationPercentage: deviationPercentage,
            previousAveragePerfScore: 72,
            currentAnalysisPerfScore: 39.6,
          },
        };
      },

      async action08_notifyManagerWithAnalysisResult() {
        // This should NOT be called due to escalation
        throw new Error('action08 should not be invoked during escalation');
      },
    };

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    // Verify escalation was triggered
    expect(result.executionStatus).toBe('escalated_awaiting_human_review');
    expect(result.processStatus).toBe('ESCALATED_AWAITING_HUMAN_REVIEW');

    // Verify escalation context contains deviation details
    expect(result.escalationContext).toBeDefined();
    expect(result.escalationContext?.anomalyType).toBe('SIGNIFICANT_DEVIATION');
    expect(result.escalationContext?.deviationPercentage).toBe(-45);
    expect(result.escalationContext?.previousAveragePerfScore).toBe(72);
    expect(result.escalationContext?.currentAnalysisPerfScore).toBe(39.6);
    expect(result.escalationContext?.reviewRequiredByRole).toBe('DIRECTOR');

    // Verify audit log was recorded
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.length).toBeGreaterThan(0);

    const escalationEvent = result.auditLog.find(
      (log) => log.eventType === 'escalation'
    );
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent?.operationId).toBeDefined();
    expect(escalationEvent?.escalationReason).toBe(
      'SIGNIFICANT_DEVIATION from historical trend'
    );
    expect(escalationEvent?.affectedDataRange).toEqual({
      month: '2024-01',
      reportCount: 10,
      dateRange: { start: '2024-01-01', end: '2024-01-31' },
    });

    // Verify analysis result is included but not yet applied
    expect(result.analysisResultSummary).toBeDefined();
    expect(result.analysisResultSummary?.performanceMetrics.overallPerformanceScore).toBe(
      39.6
    );

    // Verify delivery timestamp is NOT set (result not delivered to manager)
    expect(result.deliveryTimestamp).toBeUndefined();

    // Verify manager notification was NOT sent
    expect(result.notificationSent).toBe(false);
  });
});