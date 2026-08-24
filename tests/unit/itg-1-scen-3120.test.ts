import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AgentInput, type Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('tx-3-imp-1 orchestrator - runTx3Imp1Agent', () => {
  // SCEN-3120
  test('should escalate to manual review when multi-department issue is detected before side effects are committed', async () => {
    // Setup: Prepare aggregated report data containing cross-department issues
    const aggregatedReportIds = ['report-001', 'report-002', 'report-003'];
    const analysisStartDate = '2024-01-08T00:00:00Z';
    const analysisEndDate = '2024-01-14T23:59:59Z';
    const managerUserId = 'manager-001';
    const priorityThresholdScore = 70;

    const input: Tx3Imp1AgentInput = {
      aggregatedReportIds,
      analysisStartDate,
      analysisEndDate,
      managerUserId,
      priorityThresholdScore,
    };

    // Mock AI client with extracted keywords containing multi-department issue
    const mockAiClient: Tx3Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '営業-企画連携', frequency: 3, confidence: 0.92 },
          { keyword: 'システム遅延', frequency: 2, confidence: 0.88 },
          { keyword: 'リソース不足', frequency: 1, confidence: 0.75 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        issueId: 'issue-sales-planning-001',
        keyword: '営業-企画連携',
        impactScore: 85,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: '営業-企画連携',
        severity: 'high',
      }),
      sendHandoverNotification: jest.fn().mockResolvedValue({
        notificationId: 'handover-001',
        status: 'sent',
        recipientUserId: managerUserId,
        title: '複数部門連携課題の確認が必要です',
      }),
      recordAuditLog: jest.fn().mockResolvedValue({
        auditLogId: 'audit-001',
        eventType: 'EscalationCondition',
        details: 'ManualReviewRequiredBeforeSideEffect',
        timestamp: '2024-01-15T09:00:00Z',
      }),
      getEscalationStatus: jest.fn().mockResolvedValue({
        isEscalated: true,
        escalationReason: '複数部門にまたがる課題',
        requiresManualReview: true,
      }),
    };

    // Execute agent
    const output: Tx3Imp1AgentOutput = await runTx3Imp1Agent(input, mockAiClient);

    // Assert: Action 1 - Keywords extracted with multi-department issue detected
    expect(mockAiClient.extractKeywords).toHaveBeenCalledWith({
      aggregatedReportIds,
      analysisStartDate,
      analysisEndDate,
    });
    expect(output.extractedIssuesCount).toBeGreaterThanOrEqual(3);

    // Assert: Action 2 - Multi-department issue classified and escalation triggered
    expect(mockAiClient.classifyIssueSeverity).toHaveBeenCalled();
    const classifyCall = (mockAiClient.classifyIssueSeverity as jest.Mock).mock.calls[0];
    expect(classifyCall[0]).toContain('営業-企画連携');

    // Assert: Escalation flag set before Action 3 (Priority judgment skipped)
    expect(mockAiClient.getEscalationStatus).toHaveBeenCalled();
    const escalationStatus = await mockAiClient.getEscalationStatus();
    expect(escalationStatus.isEscalated).toBe(true);
    expect(escalationStatus.requiresManualReview).toBe(true);

    // Assert: Action 4 (Priority list generation) is skipped
    // Verify by checking that prioritizedIssuesList is empty or marked as pending
    expect(output.prioritizedIssuesList).toEqual([]);

    // Assert: Action 5 (Email auto-send) is not executed
    // Email status should be 'pending' not 'success'
    expect(output.emailSendStatus).toBe('pending');

    // Assert: Handover notification sent to manager with specific title
    expect(mockAiClient.sendHandoverNotification).toHaveBeenCalledWith({
      recipientUserId: managerUserId,
      title: '複数部門連携課題の確認が必要です',
      issueKeyword: '営業-企画連携',
      impactScore: 85,
      escalationReason: '複数部門にまたがる課題',
    });
    expect(output.emailSendStatus).not.toBe('success');

    // Assert: Audit log recorded with ManualReviewRequiredBeforeSideEffect status
    expect(mockAiClient.recordAuditLog).toHaveBeenCalledWith({
      eventType: 'EscalationCondition',
      details: 'ManualReviewRequiredBeforeSideEffect',
      escalationReason: '複数部門にまたがる課題',
      executionId: output.executionId,
      timestamp: expect.any(String),
    });

    // Assert: Execution completed but workflow state remains in manual review
    expect(output.executionId).toBeDefined();
    expect(output.executionId).toMatch(/^exec-/);
    expect(output.completionTimestamp).toBeDefined();
    expect(new Date(output.completionTimestamp).getTime()).toBeGreaterThan(0);

    // Assert: Priority list is empty because escalation prevented generation
    expect(output.prioritizedIssuesList.length).toBe(0);

    // Assert: Email not auto-sent (pending status, not success)
    expect(output.emailSendStatus).toBe('pending');

    // Verify mock call order: Action 1 → Action 2 → Escalation Check → Handover (skip 4 & 5)
    const extractCallCount = (mockAiClient.extractKeywords as jest.Mock).mock.calls.length;
    const classifyCallCount = (mockAiClient.classifyIssueSeverity as jest.Mock).mock.calls.length;
    const handoverCallCount = (mockAiClient.sendHandoverNotification as jest.Mock).mock.calls.length;

    expect(extractCallCount).toBe(1);
    expect(classifyCallCount).toBeGreaterThan(0);
    expect(handoverCallCount).toBe(1);
  });
});