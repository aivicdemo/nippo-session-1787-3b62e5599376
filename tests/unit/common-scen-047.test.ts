import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('tx-2-imp-1 orchestrator', () => {
  // SCEN-047: [error] 日報収集から課題抽出・配信までの自律実行 AIエージェント - 「日報収集から課題抽出・配信までの自律実行」が「重大インシデント・顧客クレームが報告された場合」の場合に副作用の確定前に人へ引き継ぐ
  test('should escalate to human when critical incident with customer complaint is detected before confirming email delivery', async () => {
    const mockExecutionTimestamp = new Date('2024-01-15T08:55:00Z');
    const mockReportingDeadline = new Date('2024-01-15T09:00:00Z');
    const mockTeamId = 'team-001';
    const mockManagerEmail = 'manager@example.com';

    const mockAggregatedReportData = {
      submittedMembersCount: 10,
      unsubmittedMembersCount: 0,
      reportDataList: [
        {
          memberId: 'mem-001',
          memberName: 'Engineer A',
          reportContent: 'Fixed bug in module X',
          timestamp: new Date('2024-01-15T08:50:00Z'),
          issues: [],
        },
        {
          memberId: 'mem-002',
          memberName: 'Engineer B',
          reportContent: 'Completed feature Y development',
          timestamp: new Date('2024-01-15T08:50:00Z'),
          issues: [],
        },
        {
          memberId: 'mem-003',
          memberName: 'Engineer C',
          reportContent: 'Critical incident: Production system failure, received emergency calls from 5 customers',
          timestamp: new Date('2024-01-15T08:52:00Z'),
          issues: [],
        },
        {
          memberId: 'mem-004',
          memberName: 'Engineer D',
          reportContent: 'Database optimization ongoing',
          timestamp: new Date('2024-01-15T08:50:00Z'),
          issues: [],
        },
        {
          memberId: 'mem-005',
          memberName: 'Engineer E',
          reportContent: 'Code review completed for PR #123',
          timestamp: new Date('2024-01-15T08:50:00Z'),
          issues: [],
        },
        {
          memberId: 'mem-006',
          memberName: 'Engineer F',
          reportContent: 'Deployment preparation in progress',
          timestamp: new Date('2024-01-15T08:50:00Z'),
          issues: [],
        },
        {
          memberId: 'mem-007',
          memberName: 'Engineer G',
          reportContent: 'Testing regression suite',
          timestamp: new Date('2024-01-15T08:50:00Z'),
          issues: [],
        },
        {
          memberId: 'mem-008',
          memberName: 'Engineer H',
          reportContent: 'Documentation update',
          timestamp: new Date('2024-01-15T08:50:00Z'),
          issues: [],
        },
        {
          memberId: 'mem-009',
          memberName: 'Engineer I',
          reportContent: 'Infrastructure monitoring',
          timestamp: new Date('2024-01-15T08:50:00Z'),
          issues: [],
        },
        {
          memberId: 'mem-010',
          memberName: 'Engineer J',
          reportContent: 'Security audit review',
          timestamp: new Date('2024-01-15T08:50:00Z'),
          issues: [],
        },
      ],
    };

    const mockExtractedIssue = {
      issueId: 'issue-critical-001',
      content: 'Production system failure - emergency calls from 5 customers',
      category: 'CRITICAL_INCIDENT_CUSTOMER_COMPLAINT',
      severity: 'CRITICAL',
      reportedByMemberId: 'mem-003',
      reportedAt: new Date('2024-01-15T08:52:00Z'),
      affectedCustomerCount: 5,
    };

    const mockHandoverRecord = {
      handoverId: 'handover-001',
      escalationReason: 'CRITICAL_INCIDENT_CUSTOMER_COMPLAINT',
      detectedAt: new Date('2024-01-15T08:52:00Z'),
      extractedIssueContent: 'Production system failure - emergency calls from 5 customers',
      priorityJudgmentResult: 'ESCALATE_TO_HUMAN',
      extractedIssueData: mockExtractedIssue,
      executionTrace: {
        action1_complete: true,
        action2_complete: true,
        action3_complete: true,
        action4_blocked: true,
      },
      handoverNotificationSent: true,
      auditLogEntries: [
        {
          timestamp: new Date('2024-01-15T08:52:00Z'),
          eventType: 'CRITICAL_INCIDENT_DETECTED',
          message: 'Critical incident with customer complaint detected during issue extraction',
        },
        {
          timestamp: new Date('2024-01-15T08:52:05Z'),
          eventType: 'ESCALATION_TO_HUMAN',
          message: 'Escalation process initiated - awaiting human approval before email delivery',
        },
      ],
    };

    const mockAiClient = {
      action01_collectDailyReports: async () => ({
        aggregationStatus: 'success',
        aggregatedReportData: mockAggregatedReportData,
      }),
      action02_identifyUnsubmittedMembers: async () => ({
        unsubmittedMembers: [],
        notificationStatus: 'not_needed',
      }),
      action03_extractIssues: async () => ({
        extractedIssuesCount: 1,
        extractedIssuesList: [mockExtractedIssue],
        escalationDetected: true,
        escalationReason: 'CRITICAL_INCIDENT_CUSTOMER_COMPLAINT',
      }),
      action04_generateConfirmationEmail: async () => ({
        emailGenerationStatus: 'blocked_by_escalation',
        reason: 'Critical incident detected - awaiting human approval',
      }),
      action05_recordHandoverToHuman: async () => ({
        handoverStatus: 'success',
        handoverRecord: mockHandoverRecord,
      }),
      action06_sendHandoverNotification: async () => ({
        notificationStatus: 'sent',
        notificationTimestamp: new Date('2024-01-15T08:52:10Z'),
      }),
    };

    const input = {
      executionTimestamp: mockExecutionTimestamp,
      teamId: mockTeamId,
      reportingDeadline: mockReportingDeadline,
      managerEmail: mockManagerEmail,
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);

    // (1) Verify escalation condition detection and Action-4 blocking
    expect(result.aggregationStatus).toBe('escalation_detected');
    expect(result.escalationReason).toBe('CRITICAL_INCIDENT_CUSTOMER_COMPLAINT');

    // (2) Verify handover record with issue content and timestamp
    expect(result.handoverRecord).toBeDefined();
    expect(result.handoverRecord.escalationReason).toBe('CRITICAL_INCIDENT_CUSTOMER_COMPLAINT');
    expect(result.handoverRecord.detectedAt).toEqual(new Date('2024-01-15T08:52:00Z'));
    expect(result.handoverRecord.extractedIssueContent).toMatch(/Production system failure/);
    expect(result.handoverRecord.extractedIssueContent).toMatch(/5 customers/);

    // (3) Verify human handover notification was sent and Action-4 blocked
    expect(result.handoverNotificationSent).toBe(true);
    expect(result.emailSendStatus).toBe('not_sent_pending_human_approval');

    // (4) Verify audit log entries for escalation
    expect(result.auditLogEntries).toBeDefined();
    expect(result.auditLogEntries.length).toBeGreaterThanOrEqual(2);
    const criticalIncidentLog = result.auditLogEntries.find(
      (entry) => entry.eventType === 'CRITICAL_INCIDENT_DETECTED'
    );
    const escalationLog = result.auditLogEntries.find(
      (entry) => entry.eventType === 'ESCALATION_TO_HUMAN'
    );
    expect(criticalIncidentLog).toBeDefined();
    expect(escalationLog).toBeDefined();
    expect(escalationLog?.message).toMatch(/awaiting human approval/);

    // Verify no confirmation email was sent
    expect(result.confirmationEmailSent).toBe(false);

    // Verify extracted issue count and data
    expect(result.extractedIssuesCount).toBe(1);
    expect(result.prioritizedIssuesList).toBeDefined();
    expect(result.prioritizedIssuesList.length).toBe(1);
    expect(result.prioritizedIssuesList[0].content).toMatch(/Production system failure/);
    expect(result.prioritizedIssuesList[0].category).toBe('CRITICAL_INCIDENT_CUSTOMER_COMPLAINT');
  });
});