import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type {
  Tx6AgentInput,
  Tx6AgentOutput,
} from '../../src/agents/tx-6-imp-1/types';

// SCEN-3174
describe('Tx6 Agent - Low Confidence AI Output Rejection', () => {
  it('should detect low confidence classification output and escalate with audit logging', async () => {
    // Setup: Mock AI client with low confidence score
    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'database_performance',
            occurrenceCount: 3,
            confidenceScore: 0.35,
          },
        ],
      }),
      classifyIssues: jest.fn().mockResolvedValue({
        classifications: [
          {
            issueId: 'issue_001',
            category: 'performance',
            confidenceScore: 0.33,
            multiCategoryHit: true,
            conflictingCategories: ['quality', 'infrastructure'],
          },
        ],
      }),
      assessImpactScore: jest.fn(),
    };

    // Setup: Mock NotificationServiceAdapter for escalation notification
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({}),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
      sendEscalationNotification: jest
        .jest
        .fn()
        .mockResolvedValue({ status: 'sent' }),
    };

    // Setup: Mock audit logger
    const mockAuditLogger: any[] = [];
    const mockLogAuditEvent = jest
      .fn()
      .mockImplementation((event: any) => {
        mockAuditLogger.push(event);
        return Promise.resolve();
      });

    // Input: Test dataset with 5 daily reports from previous week
    const input: Tx6AgentInput = {
      executionTimestamp: new Date('2024-01-08T09:00:00Z'),
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-07',
      teamId: 'team_alpha_001',
    };

    // Setup: Mock daily report data (5 reports)
    const mockReportData = [
      {
        reportId: 'report_20240101',
        submittedBy: 'engineer_001',
        issueText:
          'database query performance degradation observed in production',
        submittedAt: new Date('2024-01-01T08:30:00Z'),
      },
      {
        reportId: 'report_20240102',
        submittedBy: 'engineer_002',
        issueText: 'slow database queries affecting user experience',
        submittedAt: new Date('2024-01-02T08:45:00Z'),
      },
      {
        reportId: 'report_20240103',
        submittedBy: 'engineer_003',
        issueText: 'database indexing issue',
        submittedAt: new Date('2024-01-03T09:00:00Z'),
      },
      {
        reportId: 'report_20240105',
        submittedBy: 'engineer_004',
        issueText: 'infrastructure costs rising',
        submittedAt: new Date('2024-01-05T08:15:00Z'),
      },
      {
        reportId: 'report_20240107',
        submittedBy: 'engineer_005',
        issueText: 'system quality metrics declining',
        submittedAt: new Date('2024-01-07T09:30:00Z'),
      },
    ];

    // Mock the data retrieval function
    const mockGetReportsForWeek = jest
      .fn()
      .mockResolvedValue(mockReportData);

    // Execute: Run orchestrator with mocks
    const result = await runTx6Imp1Agent(
      input,
      mockAiClient as any,
      mockNotificationAdapter as any,
      mockLogAuditEvent,
      mockGetReportsForWeek
    );

    // Verify: Check escalation was triggered
    expect(result.executionStatus).toBe('partial_failure');
    expect(result.errorDetails).toMatch(/低信頼度|confidence|trust/i);

    // Verify: Low confidence score was detected
    expect(mockAiClient.classifyIssues).toHaveBeenCalled();
    const classifyCall = mockAiClient.classifyIssues.mock.calls[0];
    expect(classifyCall).toBeDefined();

    // Verify: Audit log entry created
    expect(mockLogAuditEvent).toHaveBeenCalled();
    const auditEvent = mockAuditLogger[0];
    expect(auditEvent.agent_id).toBe('tx_6_imp_1');
    expect(auditEvent.action).toBe('escalation_triggered');
    expect(auditEvent.reason).toBe('low_confidence_model_output');
    expect(auditEvent.confidence_score).toBe(0.33);
    expect(auditEvent.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(auditEvent.operator_id).toBeNull();

    // Verify: Escalation notification sent with manual review URL
    expect(mockNotificationAdapter.sendEscalationNotification).toHaveBeenCalled();
    const notificationCall =
      mockNotificationAdapter.sendEscalationNotification.mock.calls[0];
    expect(notificationCall[0]).toContain('分析結果の信頼度が不足');
    expect(notificationCall[0]).toMatch(/URL|リンク|確認/);

    // Verify: Report generation was not completed
    expect(result.reportId).toBeUndefined();
    expect(result.extractedIssueCount).toBe(0);

    // Verify: Conflicting categories were detected and logged
    expect(auditEvent.conflicting_categories).toContain('quality');
    expect(auditEvent.conflicting_categories).toContain('infrastructure');

    // Verify: Low confidence threshold enforcement (50% minimum)
    expect(auditEvent.confidence_score).toBeLessThan(0.5);
  });
});