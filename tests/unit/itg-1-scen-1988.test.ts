import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8AgentInput, type Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1: Orchestrator - Bottleneck Pattern Visualization', () => {
  // SCEN-1988
  test('should throw MissingIssueFrequencyDataError when issue frequency data is missing during report generation', async () => {
    // Setup: Create mock Tx8Imp1AiClient that returns empty frequency data
    const mockAiClient = {
      extractIssueData: jest.fn().mockResolvedValue({
        issueKeywords: [],
        occurrenceFrequencies: [],
        issueCategories: [],
        timePeriod: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      }),
      analyzeBottleneckPatterns: jest.fn().mockRejectedValue(
        new Error(
          JSON.stringify({
            errorCode: 'DATA_VALIDATION_ERROR',
            message: '課題発生頻度データが欠落しています',
            details: {
              missingField: 'occurrenceFrequencies',
              receivedLength: 0,
            },
          })
        )
      ),
      generateVisualizationReport: jest.fn(),
      escalateAlert: jest.fn(),
      recordAuditLog: jest.fn(),
    };

    const testInput: Tx8AgentInput = {
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-31',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'manager-001',
    };

    // Execute: Run orchestrator with mock client and test input
    const orchestratorPromise = runTx8Imp1Agent(testInput, mockAiClient);

    // Verify: Expect MissingIssueFrequencyDataError to be thrown
    await expect(orchestratorPromise).rejects.toThrow(/課題発生頻度データが欠落/);

    // Verify Action 3 (analyzeBottleneckPatterns) was called and failed
    expect(mockAiClient.analyzeBottleneckPatterns).toHaveBeenCalled();

    // Verify Action 4 (generateVisualizationReport) was NOT called due to escalation
    expect(mockAiClient.generateVisualizationReport).not.toHaveBeenCalled();

    // Verify audit log recorded escalation event with data_quality_below_threshold
    expect(mockAiClient.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'escalation',
        escalationType: 'data_quality_below_threshold',
        severity: 'high',
        timestamp: expect.any(String),
      })
    );

    // Verify escalateAlert was triggered due to data validation failure
    expect(mockAiClient.escalateAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alertType: 'DATA_VALIDATION_ERROR',
        message: expect.stringContaining('課題発生頻度データ'),
      })
    );

    // Verify that no partial side effects (cache, temp files) were created
    // by confirming generateVisualizationReport never created artifacts
    expect(mockAiClient.generateVisualizationReport).not.toHaveBeenCalled();
  });
});