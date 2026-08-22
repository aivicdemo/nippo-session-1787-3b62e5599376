import { runTx9Imp1Agent, type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('TX-9 日報集約から分析報告までの自動実行エージェント', () => {
  // SCEN-167
  test('データ品質が低い場合、副作用確定前に人へ引き継ぐ', async () => {
    const mockAiClient: Tx9Imp1AiClient = {
      action01_aggregateReportingData: jest.fn().mockResolvedValue({
        aggregatedReports: [
          { reportId: 'R001', content: 'Sample report 1', submittedAt: '2024-01-15T09:00:00Z' },
          { reportId: 'R002', content: 'Sample report 2', submittedAt: '2024-01-15T09:15:00Z' },
        ],
        totalCount: 2,
        submittedCount: 2,
      }),

      action02_identifyUnsubmittedMembers: jest.fn().mockResolvedValue({
        unsubmittedMembers: [],
        remindersSent: 0,
      }),

      action03_validateDataQuality: jest.fn().mockResolvedValue({
        qualityScore: 0.45,
        missingDataRate: 0.35,
        malformedRecordCount: 3,
        requiresEscalation: true,
        escalationReason: 'DATA_QUALITY_LOW_OR_INCOMPLETE',
      }),

      action04_extractAndClassifyIssues: jest.fn(),
      action05_proposeMeasures: jest.fn(),
      action06_generateReport: jest.fn(),
      action07_presentToManager: jest.fn(),
    };

    const auditLogs: Array<{
      timestamp: string;
      userId: string;
      escalationReason: string;
      dataQualityMetrics: {
        qualityScore: number;
        missingDataRate: number;
        malformedRecordCount: number;
      };
      escalatedToRole: string;
    }> = [];

    const input = {
      aggregationStartDate: '2024-01-15',
      aggregationEndDate: '2024-01-15',
      targetTeamIds: ['T001'],
      requestedByUserId: 'U-manager-001',
    };

    const result = await runTx9Imp1Agent(input, mockAiClient, {
      auditLog: (entry: unknown) => {
        auditLogs.push(entry as typeof auditLogs[0]);
      },
    });

    expect(mockAiClient.action01_aggregateReportingData).toHaveBeenCalledWith(input);
    expect(mockAiClient.action02_identifyUnsubmittedMembers).toHaveBeenCalled();
    expect(mockAiClient.action03_validateDataQuality).toHaveBeenCalled();

    expect(mockAiClient.action04_extractAndClassifyIssues).not.toHaveBeenCalled();
    expect(mockAiClient.action05_proposeMeasures).not.toHaveBeenCalled();
    expect(mockAiClient.action06_generateReport).not.toHaveBeenCalled();
    expect(mockAiClient.action07_presentToManager).not.toHaveBeenCalled();

    expect(result.status).toBe('ESCALATED_AWAITING_HUMAN_REVIEW');
    expect(result.pendingHumanAction).toBe(true);
    expect(result.escalationReason).toBe('DATA_QUALITY_LOW_OR_INCOMPLETE');

    expect(auditLogs).toHaveLength(1);
    const auditEntry = auditLogs[0];
    expect(auditEntry.timestamp).toBeDefined();
    expect(auditEntry.userId).toBe('U-manager-001');
    expect(auditEntry.escalationReason).toBe('DATA_QUALITY_LOW_OR_INCOMPLETE');
    expect(auditEntry.dataQualityMetrics.qualityScore).toBe(0.45);
    expect(auditEntry.dataQualityMetrics.missingDataRate).toBe(0.35);
    expect(auditEntry.dataQualityMetrics.malformedRecordCount).toBe(3);
    expect(auditEntry.escalatedToRole).toBe('manager');
  });
});