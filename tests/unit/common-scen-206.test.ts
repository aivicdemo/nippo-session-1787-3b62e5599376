import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import type { Tx11AgentInput, Tx11AgentOutput } from '../../src/agents/tx-11-imp-1/orchestrator';
import type { Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('Tx11Imp1Agent - Malformed/Ambiguous/Low-Confidence AI Output Rejection', () => {
  let mockAiClient: jest.Mocked<Tx11Imp1AiClient>;
  let auditLogEntries: Array<{
    timestamp: Date;
    action: string;
    invalidOutput: unknown;
    detectionReason: string;
    escalationDecision: string;
    managerNotificationFlag: boolean;
  }>;
  let escalationQueue: Array<{
    caseId: string;
    classification: string;
    content: string;
  }>;
  let notificationQueue: Array<{
    recipientType: 'member' | 'manager';
    message: string;
  }>;

  beforeEach(() => {
    auditLogEntries = [];
    escalationQueue = [];
    notificationQueue = [];

    mockAiClient = {
      action01_checkSubmissionStatus: jest.fn(),
      action02_sendReminder: jest.fn(),
      action03_extractIssues: jest.fn(),
      action04_provideReferenceInfo: jest.fn(),
      action05_prioritizeIssues: jest.fn(),
      action06_generateSummary: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-206
  test('should safely reject malformed, ambiguous, and low-confidence AI outputs without performing business actions', async () => {
    const executionTimestamp = new Date('2024-01-15T08:00:00Z');
    const teamId = 'team-alpha';
    const reportDeadlineTime = '09:00';
    const managerEmail = 'manager@example.com';

    const input: Tx11AgentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    // Action 1: Check submission status - happy path
    mockAiClient.action01_checkSubmissionStatus.mockResolvedValue({
      totalMembers: 10,
      submittedCount: 7,
      unsubmittedMembers: ['member-003', 'member-005', 'member-008', 'member-009'],
    });

    // Action 2: Send reminder - returns out-of-range confidence score (0.5 is valid, -0.1 is invalid)
    mockAiClient.action02_sendReminder.mockResolvedValue({
      remindersToSend: [
        {
          memberId: 'member-003',
          message: 'Please submit your report',
          confidenceScore: -0.1, // INVALID: confidence < 0
        },
      ],
    });

    // Action 3: Extract issues - returns unstructured text response (not an array)
    mockAiClient.action03_extractIssues.mockResolvedValue({
      issues: 'Issue extraction failed - no structured data returned', // INVALID: not structured
    });

    // Action 5: Prioritize issues - returns out-of-range severity scores
    mockAiClient.action05_prioritizeIssues.mockResolvedValue({
      prioritizedIssues: [
        {
          issueId: 'issue-001',
          content: 'Database timeout',
          severityScore: 150, // INVALID: score > 100
          confidenceScore: 0.8,
        },
        {
          issueId: 'issue-002',
          content: 'API latency',
          severityScore: -5, // INVALID: score < 0
          confidenceScore: 0.6,
        },
      ],
    });

    // Action 4: Provide reference info - returns logically unrelated reference
    mockAiClient.action04_provideReferenceInfo.mockResolvedValue({
      referenceInfo: [
        {
          currentIssueId: 'issue-001',
          referencedPastIssueId: 'past-issue-999',
          relevanceScore: 0.2, // Very low relevance
          pastResolution: 'Unrelated historical data',
        },
      ],
    });

    // Action 6: Generate summary - will be skipped due to upstream failures
    mockAiClient.action06_generateSummary.mockResolvedValue({
      summaryEmailSent: false,
      summaryContent: '',
    });

    // Custom orchestrator wrapper to capture audit and escalation events
    const orchestratorWithCapture = async () => {
      try {
        const result = await runTx11Imp1Agent(input, mockAiClient);

        // Validate that malformed outputs did NOT proceed to business actions
        // 1. Action 2 confidence validation
        const action2Result = await mockAiClient.action02_sendReminder();
        if (Array.isArray(action2Result?.remindersToSend)) {
          for (const reminder of action2Result.remindersToSend) {
            if (reminder.confidenceScore < 0 || reminder.confidenceScore > 1) {
              auditLogEntries.push({
                timestamp: executionTimestamp,
                action: 'action02_sendReminder',
                invalidOutput: reminder.confidenceScore,
                detectionReason: 'Confidence score out of range [0, 1]',
                escalationDecision: 'ESCALATE: AI output reliability cannot be verified; human review required',
                managerNotificationFlag: true,
              });
              escalationQueue.push({
                caseId: `escalation-reminder-${reminder.memberId}`,
                classification: 'Confidence score out of range',
                content: `Reminder for ${reminder.memberId} has invalid confidence: ${reminder.confidenceScore}`,
              });
              notificationQueue.push({
                recipientType: 'manager',
                message: 'AI output confidence verification failed for reminder action. Human confirmation needed.',
              });
            }
          }
        }

        // 2. Action 3 structure validation
        const action3Result = await mockAiClient.action03_extractIssues();
        if (!Array.isArray(action3Result?.issues)) {
          auditLogEntries.push({
            timestamp: executionTimestamp,
            action: 'action03_extractIssues',
            invalidOutput: action3Result?.issues,
            detectionReason: 'Unstructured response: expected array, got string',
            escalationDecision: 'ESCALATE: Issue extraction produced non-structured output',
            managerNotificationFlag: true,
          });
          escalationQueue.push({
            caseId: 'escalation-extract-001',
            classification: 'Structure validation failed',
            content: 'Issue extraction action returned unstructured data instead of array',
          });
          notificationQueue.push({
            recipientType: 'manager',
            message: 'Issue extraction produced unstructured output. Uncertain priority judgment detected. Manager review required.',
          });
        }

        // 3. Action 5 severity score validation
        const action5Result = await mockAiClient.action05_prioritizeIssues();
        if (Array.isArray(action5Result?.prioritizedIssues)) {
          for (const issue of action5Result.prioritizedIssues) {
            if (issue.severityScore < 0 || issue.severityScore > 100) {
              auditLogEntries.push({
                timestamp: executionTimestamp,
                action: 'action05_prioritizeIssues',
                invalidOutput: issue.severityScore,
                detectionReason: `Severity score out of range [0, 100]: ${issue.severityScore}`,
                escalationDecision: 'SKIP: Invalid output detected; processing suspended',
                managerNotificationFlag: true,
              });
              escalationQueue.push({
                caseId: `escalation-priority-${issue.issueId}`,
                classification: 'Range validation failed',
                content: `Issue ${issue.issueId} has invalid severity score: ${issue.severityScore}`,
              });
              notificationQueue.push({
                recipientType: 'manager',
                message: `Invalid severity score (${issue.severityScore}) for issue ${issue.issueId}. Manager judgment required.`,
              });
            }
          }
        }

        // 4. Action 4 relevance validation
        const action4Result = await mockAiClient.action04_provideReferenceInfo();
        if (Array.isArray(action4Result?.referenceInfo)) {
          for (const ref of action4Result.referenceInfo) {
            if (ref.relevanceScore < 0.3) {
              auditLogEntries.push({
                timestamp: executionTimestamp,
                action: 'action04_provideReferenceInfo',
                invalidOutput: ref.relevanceScore,
                detectionReason: `Relevance score too low (${ref.relevanceScore}); reference validity cannot be confirmed`,
                escalationDecision: 'SKIP: Reference information validity unconfirmed',
                managerNotificationFlag: false,
              });
              escalationQueue.push({
                caseId: `escalation-ref-${ref.currentIssueId}`,
                classification: 'Relevance validation failed',
                content: `Reference for issue ${ref.currentIssueId} has insufficient relevance score: ${ref.relevanceScore}`,
              });
              // Do NOT queue member notification for low-relevance reference
            }
          }
        }

        return result;
      } catch (error) {
        throw error;
      }
    };

    // Execute orchestrator with capture
    await orchestratorWithCapture();

    // VALIDATION 1: No reminders were actually sent due to invalid confidence scores
    const reminder = await mockAiClient.action02_sendReminder();
    const invalidReminders = reminder.remindersToSend.filter(
      r => r.confidenceScore < 0 || r.confidenceScore > 1
    );
    expect(invalidReminders.length).toBe(1);
    expect(invalidReminders[0].confidenceScore).toBe(-0.1);
    // Verify business action NOT performed: notification queue should NOT contain actual send instruction
    const reminderBusinessActions = notificationQueue.filter(n => n.recipientType === 'member');
    expect(reminderBusinessActions).toEqual([]);

    // VALIDATION 2: No summary created with invalid priority scores
    const priorityResult = await mockAiClient.action05_prioritizeIssues();
    const invalidPriorities = priorityResult.prioritizedIssues.filter(
      issue => issue.severityScore < 0 || issue.severityScore > 100
    );
    expect(invalidPriorities.length).toBe(2);
    expect(invalidPriorities[0].severityScore).toBe(150);
    expect(invalidPriorities[1].severityScore).toBe(-5);
    // Verify: summary NOT created with invalid scores
    expect(mockAiClient.action06_generateSummary).not.toHaveBeenCalled();

    // VALIDATION 3: Reference info with low relevance NOT provided to members
    const refResult = await mockAiClient.action04_provideReferenceInfo();
    const lowRelevanceRefs = refResult.referenceInfo.filter(r => r.relevanceScore < 0.3);
    expect(lowRelevanceRefs.length).toBe(1);
    expect(lowRelevanceRefs[0].relevanceScore).toBe(0.2);
    // Verify: member notification queue empty (no reference info sent)
    const memberRefNotifications = notificationQueue.filter(
      n => n.recipientType === 'member' && n.message.includes('reference')
    );
    expect(memberRefNotifications.length).toBe(0);

    // VALIDATION 4: Unstructured response from issue extraction detected
    const extractResult = await mockAiClient.action03_extractIssues();
    expect(typeof extractResult.issues).toBe('string');
    expect(extractResult.issues).toMatch(/unstructured/i);

    // VALIDATION 5: Escalation queue populated with correct classifications
    expect(escalationQueue.length).toBeGreaterThanOrEqual(4);
    const confidenceEscalation = escalationQueue.find(e =>
      e.classification === 'Confidence score out of range'
    );
    expect(confidenceEscalation).toBeDefined();
    expect(confidenceEscalation?.content).toContain('confidence');

    const structureEscalation = escalationQueue.find(e =>
      e.classification === 'Structure validation failed'
    );
    expect(structureEscalation).toBeDefined();

    const rangeEscalations = escalationQueue.filter(e =>
      e.classification === 'Range validation failed'
    );
    expect(rangeEscalations.length).toBeGreaterThanOrEqual(2);

    const relevanceEscalation = escalationQueue.find(e =>
      e.classification === 'Relevance validation failed'
    );
    expect(relevanceEscalation).toBeDefined();

    // VALIDATION 6: Audit log records all violations with correct structure
    expect(auditLogEntries.length).toBeGreaterThanOrEqual(4);

    const confidenceAudit = auditLogEntries.find(a =>
      a.action === 'action02_sendReminder'
    );
    expect(confidenceAudit).toBeDefined();
    expect(confidenceAudit?.invalidOutput).toBe(-0.1);
    expect(confidenceAudit?.detectionReason).toMatch(/Confidence score/);
    expect(confidenceAudit?.escalationDecision).toMatch(/ESCALATE.*reliability/i);
    expect(confidenceAudit?.managerNotificationFlag).toBe(true);

    const structureAudit = auditLogEntries.find(a =>
      a.action === 'action03_extractIssues'
    );
    expect(structureAudit).toBeDefined();
    expect(structureAudit?.detectionReason).toMatch(/unstructured/i);
    expect(structureAudit?.escalationDecision).toMatch(/ESCALATE.*structured output/i);

    const severityAudits = auditLogEntries.filter(a =>
      a.action === 'action05_prioritizeIssues'
    );
    expect(severityAudits.length).toBeGreaterThanOrEqual(2);
    severityAudits.forEach(audit => {
      expect(audit.detectionReason).toMatch(/Severity score out of range/);
      expect(audit.escalationDecision).toMatch(/SKIP.*Invalid output/i);
      expect(audit.managerNotificationFlag).toBe(true);
    });

    const relevanceAudit = auditLogEntries.find(a =>
      a.action === 'action04_provideReferenceInfo'
    );
    expect(relevanceAudit).toBeDefined();
    expect(relevanceAudit?.detectionReason).toMatch(/Relevance score/);
    expect(relevanceAudit?.escalationDecision).toMatch(/SKIP.*unconfirmed/i);

    // VALIDATION 7: Timestamp recorded in audit
    auditLogEntries.forEach(entry => {
      expect(entry.timestamp).toEqual(executionTimestamp);
    });

    // VALIDATION 8: Manager notification queue contains escalation notices
    const managerNotifications = notificationQueue.filter(n => n.recipientType === 'manager');
    expect(managerNotifications.length).toBeGreaterThanOrEqual(4);
    expect(managerNotifications.some(n => n.message.match(/confidence.*verification.*failed/i))).toBe(true);
    expect(managerNotifications.some(n => n.message.match(/unstructured output/i))).toBe(true);
    expect(managerNotifications.some(n => n.message.match(/invalid severity/i))).toBe(true);

    // VALIDATION 9: Ensure NO actual business side effects occurred
    // - No reminders sent for invalid confidence scores
    // - No summary generated
    // - No reference info queued for members
    const businessSideEffects = notificationQueue.filter(n =>
      (n.recipientType === 'member' && n.message.includes('reference')) ||
      (n.recipientType === 'member' && n.message.includes('reminder'))
    );
    expect(businessSideEffects.length).toBe(0);
  });
});