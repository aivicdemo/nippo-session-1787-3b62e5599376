import { runTx10Imp1Agent, type Tx10Imp1AiClient } from '../../src/agents/tx-10-imp-1/orchestrator';
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from '../../src/agents/tx-10-imp-1/prompts/action-06';

describe('tx-10-imp-1 Orchestrator', () => {
  // SCEN-183
  test('should execute action 6 auto-delivery of feedback after manager approval and record audit events', async () => {
    // Setup: Manager approval input
    const approvalTimestamp = new Date('2024-01-15T09:30:00Z');
    const managerUserId = 'manager-001';
    const deploymentId = 'deploy-tx10-20240115';
    
    // Setup: 10 engineers for initial feedback
    const engineerIds = [
      'eng-001', 'eng-002', 'eng-003', 'eng-004', 'eng-005',
      'eng-006', 'eng-007', 'eng-008', 'eng-009', 'eng-010'
    ];
    
    const feedbackItems = engineerIds.map((engId, index) => ({
      memberId: engId,
      feedbackText: `Improvement point ${index + 1}: Please review your report format and ensure all required fields are completed.`,
      feedbackCategory: 'report_format'
    }));

    // Setup: Deployment input matching Tx10AgentInput structure
    const deploymentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T08:00:00Z'),
      participantList: engineerIds.map((engId, index) => ({
        userId: engId,
        role: index === 0 ? 'ProjectManager' : 'Engineer',
        email: `${engId}@company.example.com`
      })),
      preparationDaysRequired: 3,
      reportingDeadlineTime: '09:00'
    };

    // Setup: Mock AI Client stub implementing Tx10Imp1AiClient interface
    const mockAiClient: Tx10Imp1AiClient = {
      callAction01: jest.fn().mockResolvedValue({
        scheduleStartDate: '2024-01-15',
        scheduleEndDate: '2024-01-18',
        phaseDeadlines: {
          phase1_setup: '2024-01-15T17:00:00Z',
          phase2_training: '2024-01-16T17:00:00Z',
          phase3_testrun: '2024-01-17T17:00:00Z'
        },
        productionStartDate: '2024-01-18'
      }),
      callAction02: jest.fn().mockResolvedValue({
        managerGuideUrl: 'https://system.example.com/guides/manager-guide-tx10.pdf',
        engineerMaterialUrls: engineerIds.map(id => `https://system.example.com/materials/eng-${id}.pdf`)
      }),
      callAction03: jest.fn().mockResolvedValue({
        initialReportAnalysisResult: {
          submissionRate: 95,
          dataQualityScore: 82,
          formatUniformityScore: 78,
          feedbackItems: feedbackItems
        }
      }),
      callAction04: jest.fn().mockResolvedValue({
        approvalStatus: 'approved',
        approverUserId: managerUserId,
        approvalTimestamp: approvalTimestamp.toISOString(),
        productionReadyDate: '2024-01-18T00:00:00Z'
      }),
      callAction05: jest.fn().mockResolvedValue({
        feedbackDeliveryTriggered: true,
        deliveryStartTimestamp: approvalTimestamp.toISOString()
      }),
      callAction06: jest.fn().mockResolvedValue({
        targetMemberCount: 10,
        deliveryRequests: engineerIds.map(memberId => ({
          memberId,
          deliveryStatus: 'success',
          deliveryTimestamp: new Date(approvalTimestamp.getTime() + 1000).toISOString(),
          feedbackContent: feedbackItems.find(f => f.memberId === memberId)?.feedbackText || ''
        }))
      })
    };

    // Verify prompt module is loaded correctly
    expect(typeof buildAction06Prompt).toBe('function');
    expect(typeof ACTION_06_PROMPT_VERSION).toBe('string');
    expect(ACTION_06_PROMPT_VERSION.length).toBeGreaterThan(0);

    // Execute orchestrator with approval trigger
    const orchestratorInput = {
      input: deploymentInput,
      approvalAction: 'approve',
      approverUserId: managerUserId,
      approvalTimestamp
    };

    const result = await runTx10Imp1Agent(orchestratorInput, mockAiClient);

    // Assertion 1: Verify AI client boundary - second parameter matches Tx10Imp1AiClient interface
    expect(mockAiClient).toBeDefined();
    expect(typeof mockAiClient.callAction01).toBe('function');
    expect(typeof mockAiClient.callAction02).toBe('function');
    expect(typeof mockAiClient.callAction03).toBe('function');
    expect(typeof mockAiClient.callAction04).toBe('function');
    expect(typeof mockAiClient.callAction05).toBe('function');
    expect(typeof mockAiClient.callAction06).toBe('function');

    // Assertion 2: Verify action 6 was invoked (auto-delivery trigger after approval)
    expect(mockAiClient.callAction06).toHaveBeenCalled();

    // Assertion 3: Verify feedback delivery output structure
    expect(result.feedbackDeliveryResult).toBeDefined();
    expect(result.feedbackDeliveryResult.targetMemberCount).toBe(10);
    expect(Array.isArray(result.feedbackDeliveryResult.deliveryRequests)).toBe(true);

    // Assertion 4: Verify each engineer received individual feedback delivery request
    const deliveryRequests = result.feedbackDeliveryResult.deliveryRequests;
    expect(deliveryRequests.length).toBe(10);
    
    engineerIds.forEach((expectedEngId, index) => {
      const deliveryRequest = deliveryRequests[index];
      expect(deliveryRequest.memberId).toBe(expectedEngId);
      expect(deliveryRequest.deliveryStatus).toBe('success');
      expect(deliveryRequest.feedbackContent).toBeTruthy();
    });

    // Assertion 5: Verify delivery status log entries (audit events)
    const auditLog = result.auditEvents || [];
    expect(Array.isArray(auditLog)).toBe(true);

    // Assertion 6: Verify audit log contains approval event
    const approvalEvent = auditLog.find(
      (event: any) => event.eventType === 'approval' && event.userId === managerUserId
    );
    expect(approvalEvent).toBeDefined();
    expect(approvalEvent.timestamp).toBe(approvalTimestamp.toISOString());
    expect(approvalEvent.action).toBe('approve');

    // Assertion 7: Verify audit log contains delivery completion events
    const deliveryCompletionEvents = auditLog.filter(
      (event: any) => event.eventType === 'feedback_delivery_completed'
    );
    expect(deliveryCompletionEvents.length).toBe(10);

    deliveryCompletionEvents.forEach((event: any, index: number) => {
      expect(event.memberId).toBe(engineerIds[index]);
      expect(event.deliveryStatus).toBe('success');
      expect(typeof event.deliveryTimestamp).toBe('string');
      expect(event.deliveryTimestamp.length).toBeGreaterThan(0);
    });

    // Assertion 8: Verify delivery completion summary matches expected counts
    const deliveryCompletionSummary = result.deliveryCompletionSummary;
    expect(deliveryCompletionSummary).toBeDefined();
    expect(deliveryCompletionSummary.targetMemberCount).toBe(10);
    expect(deliveryCompletionSummary.successDeliveryCount).toBe(10);
    expect(deliveryCompletionSummary.failedDeliveryCount).toBe(0);
    expect(deliveryCompletionSummary.targetMemberCount).toBe(deliveryCompletionSummary.successDeliveryCount);

    // Assertion 9: Verify no manual intervention required after manager approval
    expect(result.manualInterventionRequired).toBe(false);

    // Assertion 10: Verify audit trail captures approval user ID and timestamp
    const auditTrailApprovalEntry = auditLog.find(
      (event: any) => event.eventType === 'approval'
    );
    expect(auditTrailApprovalEntry.approverUserId).toBe(managerUserId);
    expect(auditTrailApprovalEntry.timestamp).toBe(approvalTimestamp.toISOString());
  });
});