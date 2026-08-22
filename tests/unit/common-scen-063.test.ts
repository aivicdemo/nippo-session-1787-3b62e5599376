import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('Tx3Imp1Agent - Escalation on Rule-Unmatched Issues', () => {
  // SCEN-063
  test('should escalate to human when action-03 detects anomalous issue that does not match prioritization rules', async () => {
    // Setup: Prepare aggregated daily report data containing an anomalous issue
    // that cannot be classified by standard prioritization rules
    const aggregatedReportId = 'agg-20240115-001';
    const anomalousIssueId = 'TASK-9999';
    const analysisExecutionTime = new Date('2024-01-15T11:00:00Z');
    const managerEmail = 'manager@company.com';

    // Setup: Prepare threshold configuration for normal issues
    const priorityThresholds = {
      highPriorityMinScore: 70,
      mediumPriorityMinScore: 40,
    };

    // Setup: Mock audit log records
    const auditEvents: Array<{
      eventType: string;
      timestamp: Date;
      issueId: string;
      reason: string;
    }> = [];

    // Setup: Mock email stub to verify no mail is sent
    const emailStub = jest.fn();

    // Setup: Create Tx3Imp1AiClient mock
    // action-01: Aggregation confirmation - returns normal aggregation data
    // action-02: Issue extraction - includes the anomalous issue
    // action-03: Priority judgment - detects rule-unmatched anomalous issue
    const mockAiClient: Tx3Imp1AiClient = {
      action01_confirmAggregation: jest.fn().mockResolvedValue({
        aggregatedReportId,
        totalReportCount: 5,
        aggregationTimestamp: analysisExecutionTime,
        aggregatedData: {
          reportIds: ['rep-001', 'rep-002', 'rep-003', 'rep-004', 'rep-005'],
          teamCoverage: 1.0,
        },
      }),

      action02_extractIssues: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            issueId: 'TASK-001',
            keyword: '遅延',
            occurrenceFrequency: 3,
            impactScope: 'high',
            isAnomalous: false,
          },
          {
            issueId: anomalousIssueId,
            keyword: '未知の外部要因による予測困難な問題',
            occurrenceFrequency: 1,
            impactScope: 'unknown',
            isAnomalous: true,
            anomalyReason: 'external_unpredictable_factor',
          },
        ],
        extractionTimestamp: analysisExecutionTime,
      }),

      action03_judgePriority: jest.fn().mockResolvedValue({
        priorityResults: [
          {
            issueId: 'TASK-001',
            priorityScore: 75,
            priorityLevel: 'high',
            ruleMatched: true,
            rationale: 'Occurs 3 times, high impact scope',
          },
          {
            issueId: anomalousIssueId,
            priorityScore: null,
            priorityLevel: null,
            ruleMatched: false,
            ruleMismatchFlag: true,
            rationale: 'Does not match standard prioritization rules due to unpredictable external factors',
          },
        ],
        executionTimestamp: analysisExecutionTime,
      }),

      action04_generateIssueList: jest.fn(),

      action05_sendEmail: jest.fn().mockImplementation(async (args) => {
        emailStub(args);
        return { sendStatus: 'sent', sentAt: analysisExecutionTime };
      }),
    };

    // Execute: Call runTx3Imp1Agent with mock Tx3Imp1AiClient
    const result = await runTx3Imp1Agent(
      {
        reportAggregationId: aggregatedReportId,
        analysisExecutionTime,
        managerEmail,
        priorityThresholds,
      },
      mockAiClient,
      {
        recordAuditEvent: (event) => {
          auditEvents.push(event);
        },
      }
    );

    // Verify: Confirm action-03 was executed
    expect(mockAiClient.action03_judgePriority).toHaveBeenCalled();

    // Verify: Confirm rule-mismatch flag was detected
    const priorityOutput = await mockAiClient.action03_judgePriority();
    const anomalousResult = priorityOutput.priorityResults.find(
      (pr: any) => pr.issueId === anomalousIssueId
    );
    expect(anomalousResult).toBeDefined();
    expect(anomalousResult.ruleMismatchFlag).toBe(true);
    expect(anomalousResult.ruleMatched).toBe(false);

    // Verify: Confirm action-04 and action-05 were NOT executed due to escalation
    expect(mockAiClient.action04_generateIssueList).not.toHaveBeenCalled();
    expect(mockAiClient.action05_sendEmail).not.toHaveBeenCalled();
    expect(emailStub).not.toHaveBeenCalled();

    // Verify: Confirm orchestrator returns escalated status
    expect(result.status).toBe('escalated_to_human');

    // Verify: Confirm audit log contains escalation event
    expect(auditEvents.length).toBeGreaterThan(0);
    const escalationEvent = auditEvents.find(
      (ev) => ev.eventType === 'anomalous_issue_escalation'
    );
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent?.issueId).toBe(anomalousIssueId);
    expect(escalationEvent?.reason).toMatch(/ルール外課題|rule.*mismatch|anomalous/i);
    expect(escalationEvent?.timestamp).toEqual(analysisExecutionTime);

    // Verify: Confirm email was not sent (side effect not committed)
    expect(result.emailSendStatus).toEqual({
      status: 'pending_human_review',
      reason: 'Escalation due to rule-unmatched issue',
    });
  });
});