import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/types';

describe('Tx8Imp1Agent - Escalation on Data Quality Below Threshold', () => {
  // SCEN-149
  test('should escalate to human when data quality score is below threshold before generating report', async () => {
    const input: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-01',
      analysisPeriodEndDate: '2024-01-31',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10,
    };

    const auditLogs: Array<{
      timestamp: string;
      type: string;
      escalationReason?: string;
      dataQualityScore?: number;
      validationErrorDetails?: string;
      requiredActionType?: string;
    }> = [];

    const fakeAiClient: Tx8Imp1AiClient = {
      action01_extractIssueData: async () => {
        return {
          issues: [
            { id: '1', title: 'Issue 1', createdAt: '2024-01-15' },
            { id: '2', title: 'Issue 2', createdAt: '2024-01-20' },
          ],
          dataQualityScore: 0.45,
          dataQualityReason: '欠損データ率が30%を超過',
          extractedAt: '2024-01-31T10:00:00Z',
        };
      },
      action02_analyzeTimeSeries: async () => {
        throw new Error('Should not be called');
      },
      action03_identifyBottlenecks: async () => {
        throw new Error('Should not be called');
      },
      action04_generateVisualizationReport: async () => {
        throw new Error('Should not be called');
      },
      action05_highlightPriorityIssues: async () => {
        throw new Error('Should not be called');
      },
      recordAuditEvent: async (event: {
        timestamp: string;
        type: string;
        escalationReason?: string;
        dataQualityScore?: number;
        validationErrorDetails?: string;
        requiredActionType?: string;
      }) => {
        auditLogs.push(event);
      },
    };

    const result = await runTx8Imp1Agent(input, fakeAiClient);

    expect(result.analysisStatus).toBe('insufficient_data');
    expect(result.reportId).toBe('');
    expect(result.recurringIssueCount).toBe(0);
    expect(result.reportDeliveryStatus).toBe('pending');

    expect(auditLogs.length).toBeGreaterThan(0);
    const escalationLog = auditLogs.find((log) => log.type === 'ESCALATION_EVENT');
    expect(escalationLog).toBeDefined();
    expect(escalationLog?.escalationReason).toBe('DATA_QUALITY_BELOW_THRESHOLD');
    expect(escalationLog?.dataQualityScore).toBe(0.45);
    expect(escalationLog?.validationErrorDetails).toBe('欠損データ率が30%を超過');
    expect(escalationLog?.requiredActionType).toBe('manual_validation');
    expect(escalationLog?.timestamp).toBeDefined();
  });
});