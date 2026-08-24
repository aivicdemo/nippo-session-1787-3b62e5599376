import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1 orchestrator - runTx7Imp1Agent', () => {
  // SCEN-3193: [error] 月次レポート生成から分析完了までの自動実行 AIエージェント - 不正・曖昧・低確信度のAI出力を拒否して安全に引き継ぐ
  test('should safely escalate when AI client returns malformed JSON, out-of-range impact scores, and low-confidence severity classifications', async () => {
    // Setup: Prepare stub AI client with three types of failures
    const stubAiClient: Tx7Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValueOnce({
        keywords: 'invalid json {[}', // malformed JSON that cannot be parsed
        frequency: NaN,
        confidence: 0.3,
      }),
      assessImpactScore: jest.fn().mockResolvedValueOnce({
        impactScore: 150, // out-of-range value (valid range: 0-100)
        rationale: 'test rationale',
        confidence: 0.4,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValueOnce({
        severity: 'high',
        confidence: 0.25, // below threshold (< 0.5)
        reasoning: 'low confidence classification',
      }),
    };

    // Setup: Prepare test dataset with 10 valid daily reports
    const testReportData = Array.from({ length: 10 }, (_, idx) => ({
      reportId: `report-${idx + 1}`,
      submittedAt: new Date(`2024-01-${String(idx + 1).padStart(2, '0')}T09:00:00Z`),
      content: `Report content for day ${idx + 1}`,
      challenges: `Challenge ${idx + 1}`,
      teamId: 'team-001',
    }));

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-02-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'manager-001',
      includeDetailedAnalysis: true,
    };

    // Execute: Run agent with stubbed AI client
    const result = await runTx7Imp1Agent(agentInput, stubAiClient);

    // Verify: Agent processing status is 'escalated'
    expect(result).toBeDefined();
    expect(result).toHaveProperty('executionStatus');
    expect(result.executionStatus).toBe('escalated');

    // Verify: Audit logs contain 3 individual AI output errors
    expect(result).toHaveProperty('auditLogs');
    expect(Array.isArray(result.auditLogs)).toBe(true);
    expect(result.auditLogs.length).toBeGreaterThanOrEqual(3);

    const malformedJsonLog = result.auditLogs.find(
      (log) => log.type === 'ai_output_error' && log.errorType === 'malformed_json'
    );
    expect(malformedJsonLog).toBeDefined();
    expect(malformedJsonLog?.timestamp).toBeDefined();
    expect(typeof malformedJsonLog?.timestamp).toBe('string');

    const outOfRangeLog = result.auditLogs.find(
      (log) => log.type === 'ai_output_error' && log.errorType === 'out_of_range_value'
    );
    expect(outOfRangeLog).toBeDefined();
    expect(outOfRangeLog?.details).toMatch(/150/);

    const lowConfidenceLog = result.auditLogs.find(
      (log) => log.type === 'ai_output_error' && log.errorType === 'low_confidence'
    );
    expect(lowConfidenceLog).toBeDefined();
    expect(lowConfidenceLog?.details).toMatch(/0\.25/);

    // Verify: Final report is not generated; status is 'manual_review_pending'
    expect(result).toHaveProperty('analysisResultSummary');
    if (result.analysisResultSummary) {
      expect(result.analysisResultSummary).toHaveProperty('status');
      expect(result.analysisResultSummary.status).toBe('manual_review_pending');
    }

    // Verify: Dashboard status indicates 'awaiting_manual_confirmation'
    expect(result).toHaveProperty('dashboardStatus');
    expect(result.dashboardStatus).toBe('awaiting_manual_confirmation');

    // Verify: Escalation information is preserved in monitoring table
    expect(result).toHaveProperty('escalationInfo');
    expect(result.escalationInfo).toBeDefined();
    expect(result.escalationInfo).toHaveProperty('escalationReason');
    expect(result.escalationInfo.escalationReason).toMatch(/AI出力が仕様に違反/i);
    expect(result.escalationInfo).toHaveProperty('detectedErrors');
    expect(Array.isArray(result.escalationInfo.detectedErrors)).toBe(true);
    expect(result.escalationInfo.detectedErrors.length).toBe(3);

    // Verify: Agent does not throw and returns via success callback (normal flow)
    expect(result).toHaveProperty('reportId');
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    // Verify: Delivery timestamp is set even in escalation state
    expect(result).toHaveProperty('deliveryTimestamp');
    expect(result.deliveryTimestamp).toBeDefined();
    expect(new Date(result.deliveryTimestamp).getTime()).toBeGreaterThan(0);

    // Verify: AI client methods were invoked
    expect(stubAiClient.extractKeywords).toHaveBeenCalled();
    expect(stubAiClient.assessImpactScore).toHaveBeenCalled();
    expect(stubAiClient.classifyIssueSeverity).toHaveBeenCalled();
  });
});