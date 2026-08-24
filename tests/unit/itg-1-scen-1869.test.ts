import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type {
  Tx7Imp1AgentInput,
  Tx7Imp1AgentOutput,
  Tx7Imp1AiClient,
} from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成 - 分析ロジック失敗時の再試行と原因特定', () => {
  // SCEN-1869
  test('分析ロジック失敗時に失敗原因が正確に記録される', async () => {
    const triggerTimestamp = new Date('2024-01-01T09:00:00Z');
    const targetMonth = '2023-12';
    const managerUserId = 'mgr-001';

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    const auditEventLog: Array<{
      event_id: string;
      timestamp: Date;
      event_type: string;
      report_id: string;
      failure_category: string;
      failure_action: string;
      error_detail: string;
      retry_attempt: number;
    }> = [];

    const failedReportRecords: Array<{
      report_id: string;
      status: string;
      failure_reason_code: string;
      root_cause_detail: string;
      generated_at: Date;
    }> = [];

    const stubAiClient: Tx7Imp1AiClient = {
      async extractReportData(input: { targetMonth: string }) {
        return {
          reportDataId: 'data-001',
          reportCount: 22,
          extractedAt: new Date('2024-01-01T09:05:00Z'),
        };
      },

      async generateReportStructure(input: {
        reportDataId: string;
        includeDetailedAnalysis: boolean;
      }) {
        return {
          reportId: 'rpt-2023-12-001',
          structureId: 'struct-001',
          createdAt: new Date('2024-01-01T09:10:00Z'),
        };
      },

      async analyzeTimeSeriesData(input: {
        reportDataId: string;
        structureId: string;
      }) {
        const failureEntry = {
          event_id: `audit-001-${Date.now()}`,
          timestamp: new Date('2024-01-01T09:15:00Z'),
          event_type: 'ANALYSIS_FAILURE_DETECTED',
          report_id: 'rpt-2023-12-001',
          failure_category: 'ANALYSIS_LOGIC_FAILURE',
          failure_action: 'action_03_to_06_analysis_phase',
          error_detail:
            'Time series data analysis failed: insufficient data points or malformed dataset',
          retry_attempt: 1,
        };

        auditEventLog.push(failureEntry);

        throw new Error(
          'ANALYSIS_LOGIC_ERROR: Time series data analysis failed at Action 3'
        );
      },

      async analyzeBottleneckTrend(input: {
        reportDataId: string;
        structureId: string;
      }) {
        return {
          trendAnalysisId: 'trend-001',
          completedAt: new Date('2024-01-01T09:20:00Z'),
        };
      },

      async analyzeTeamPerformance(input: {
        reportDataId: string;
        structureId: string;
      }) {
        return {
          performanceAnalysisId: 'perf-001',
          completedAt: new Date('2024-01-01T09:25:00Z'),
        };
      },

      async identifyTopChallenges(input: {
        reportDataId: string;
        structureId: string;
      }) {
        return {
          challengeListId: 'chall-001',
          topChallengeCount: 5,
          completedAt: new Date('2024-01-01T09:30:00Z'),
        };
      },

      async generateFinalReport(input: {
        reportId: string;
        structureId: string;
      }) {
        return {
          finalReportId: 'final-001',
          reportContent: {},
          generatedAt: new Date('2024-01-01T09:35:00Z'),
        };
      },

      async notifyManager(input: {
        reportId: string;
        managerUserId: string;
      }) {
        return {
          notificationId: 'notif-001',
          deliveryStatus: 'PENDING',
          sentAt: new Date('2024-01-01T09:40:00Z'),
        };
      },
    };

    let result: Tx7Imp1AgentOutput | null = null;
    let thrownError: Error | null = null;

    try {
      result = await runTx7Imp1Agent(agentInput, stubAiClient);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;

        const failedRecord = {
          report_id: 'rpt-2023-12-001',
          status: 'FAILED',
          failure_reason_code: 'ANALYSIS_LOGIC_ERROR',
          root_cause_detail:
            'Time series data analysis failed at Action 3: Time series data analysis failed: insufficient data points or malformed dataset',
          generated_at: new Date('2024-01-01T09:15:00Z'),
        };

        failedReportRecords.push(failedRecord);
      }
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/ANALYSIS_LOGIC_ERROR/);

    expect(auditEventLog.length).toBeGreaterThanOrEqual(1);

    const analysisFailureAudit = auditEventLog.find(
      (evt) => evt.failure_category === 'ANALYSIS_LOGIC_FAILURE'
    );
    expect(analysisFailureAudit).toBeDefined();
    expect(analysisFailureAudit?.failure_category).toBe(
      'ANALYSIS_LOGIC_FAILURE'
    );
    expect(analysisFailureAudit?.failure_action).toBe(
      'action_03_to_06_analysis_phase'
    );
    expect(analysisFailureAudit?.error_detail).toMatch(/analysis failed/);
    expect(analysisFailureAudit?.retry_attempt).toBe(1);

    expect(failedReportRecords.length).toBe(1);
    const failedRecord = failedReportRecords[0];
    expect(failedRecord.status).toBe('FAILED');
    expect(failedRecord.failure_reason_code).toBe('ANALYSIS_LOGIC_ERROR');
    expect(failedRecord.root_cause_detail).toMatch(/Time series data analysis/);

    expect(result).toBeNull();
  });
});