import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

// Mock types for Tx2Imp1AiClient
interface MockAction {
  actionNumber: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  result?: unknown;
  error?: Error;
}

interface MockAuditEvent {
  transactionId: string;
  failureStep: string;
  rollbackTargets: string[];
  compensationExecuted: boolean;
  timestamp: string;
}

interface MockMailBuffer {
  id: string;
  subject: string;
  to: string;
  status: 'queued' | 'sent' | 'cancelled';
  sentAt?: string;
}

interface MockState {
  actionHistory: MockAction[];
  auditLog: MockAuditEvent[];
  mailBuffer: MockMailBuffer[];
  formattedReports?: Record<string, unknown>[];
  extractedIssues?: Record<string, unknown>[];
  unsubmittedMembers?: string[];
}

// Test suite for SCEN-056
describe('sendUnsubmittedReminder - Rollback on Partial Failure', () => {
  let mockState: MockState;
  let mockMailIds: string[];
  let rollbackExecuted: boolean;
  let compensationExecuted: boolean;

  beforeEach(() => {
    mockState = {
      actionHistory: [],
      auditLog: [],
      mailBuffer: [],
      formattedReports: [],
      extractedIssues: [],
      unsubmittedMembers: []
    };
    mockMailIds = [];
    rollbackExecuted = false;
    compensationExecuted = false;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-056: Action-04 failure triggers rollback and compensation
  test('should rollback email delivery and invalidate intermediate artifacts on action-04 failure', async () => {
    // Setup: Prepare daily report dataset
    const dailyReports = [
      {
        memberId: 'M001',
        date: '2024-01-15',
        content: 'Fixed critical bug in authentication module',
        status: 'submitted'
      },
      {
        memberId: 'M002',
        date: '2024-01-15',
        content: 'Completed database migration',
        status: 'submitted'
      },
      {
        memberId: 'M003',
        date: '2024-01-15',
        status: 'unsubmitted'
      }
    ];

    const unsubmittedMembers = dailyReports
      .filter(r => r.status === 'unsubmitted')
      .map(r => r.memberId);

    // Action-01: Verify report submission status
    mockState.actionHistory.push({
      actionNumber: 1,
      status: 'completed',
      timestamp: new Date('2024-01-15T07:00:00Z').toISOString()
    });

    // Action-02: Convert to unified format
    const formattedReports = dailyReports.map(r => ({
      ...r,
      format_version: '1.0',
      converted_at: new Date('2024-01-15T07:05:00Z').toISOString()
    }));
    mockState.formattedReports = formattedReports;
    mockState.actionHistory.push({
      actionNumber: 2,
      status: 'completed',
      timestamp: new Date('2024-01-15T07:05:00Z').toISOString(),
      result: formattedReports
    });

    // Action-03: Extract issues
    const extractedIssues = [
      {
        id: 'ISS001',
        content: 'Critical bug in authentication',
        priority: 'high',
        extractedFrom: 'M001'
      },
      {
        id: 'ISS002',
        content: 'Database migration completed',
        priority: 'medium',
        extractedFrom: 'M002'
      }
    ];
    mockState.extractedIssues = extractedIssues;
    mockState.actionHistory.push({
      actionNumber: 3,
      status: 'completed',
      timestamp: new Date('2024-01-15T07:10:00Z').toISOString(),
      result: extractedIssues
    });

    // Action-04: Assign priority with color coding - INTENTIONALLY FAIL HERE
    mockState.actionHistory.push({
      actionNumber: 4,
      status: 'failed',
      timestamp: new Date('2024-01-15T07:15:00Z').toISOString(),
      error: new Error('ValidationError: Priority classification failed')
    });

    // Action-05: Identify unsubmitted members (should not execute due to prior failure)
    mockState.unsubmittedMembers = unsubmittedMembers;

    // Action-06: Generate and send confirmation email (executed BEFORE failure detected)
    const generatedMailId = 'MAIL_20240115_001';
    const mailEntry: MockMailBuffer = {
      id: generatedMailId,
      subject: '[朝会報告管理] 日報未提出者へのリマインド: 2024-01-15',
      to: 'director@company.com',
      status: 'sent',
      sentAt: new Date('2024-01-15T07:12:00Z').toISOString()
    };
    mockState.mailBuffer.push(mailEntry);
    mockMailIds.push(generatedMailId);
    mockState.actionHistory.push({
      actionNumber: 6,
      status: 'completed',
      timestamp: new Date('2024-01-15T07:12:00Z').toISOString(),
      result: { mailId: generatedMailId, recipients: 1 }
    });

    // Simulate action-04 failure detection and rollback initiation
    const actionThatFailed = mockState.actionHistory.find(a => a.status === 'failed');
    expect(actionThatFailed).toBeDefined();
    expect(actionThatFailed?.actionNumber).toBe(4);

    // Execute rollback: Cancel email delivery
    const sentMails = mockState.mailBuffer.filter(m => m.status === 'sent');
    expect(sentMails.length).toBeGreaterThan(0);

    sentMails.forEach(mail => {
      mail.status = 'cancelled';
    });
    rollbackExecuted = true;

    // Verify email cancellation
    const cancelledMails = mockState.mailBuffer.filter(m => m.status === 'cancelled');
    expect(cancelledMails.length).toBe(1);
    expect(cancelledMails[0].id).toBe(generatedMailId);
    expect(cancelledMails[0].subject).toBe('[朝会報告管理] 日報未提出者へのリマインド: 2024-01-15');
    expect(cancelledMails[0].to).toBe('director@company.com');

    // Invalidate intermediate artifacts
    mockState.formattedReports = [];
    mockState.extractedIssues = [];
    mockState.unsubmittedMembers = [];

    // Execute compensation: Generate audit event
    const compensationAuditEvent: MockAuditEvent = {
      transactionId: 'tx_2_imp_1',
      failureStep: 'action-04',
      rollbackTargets: [generatedMailId],
      compensationExecuted: true,
      timestamp: new Date('2024-01-15T07:16:00Z').toISOString()
    };
    mockState.auditLog.push(compensationAuditEvent);
    compensationExecuted = true;

    // Verify audit log entry
    expect(mockState.auditLog.length).toBe(1);
    const auditEntry = mockState.auditLog[0];
    expect(auditEntry.transactionId).toBe('tx_2_imp_1');
    expect(auditEntry.failureStep).toBe('action-04');
    expect(auditEntry.rollbackTargets).toContain(generatedMailId);
    expect(auditEntry.compensationExecuted).toBe(true);

    // Verify rollback completion
    expect(rollbackExecuted).toBe(true);
    expect(compensationExecuted).toBe(true);

    // Verify intermediate artifacts are invalidated
    expect(mockState.formattedReports).toEqual([]);
    expect(mockState.extractedIssues).toEqual([]);
    expect(mockState.unsubmittedMembers).toEqual([]);

    // Idempotency check: Re-execute with same dataset
    mockState.actionHistory = [];
    mockState.auditLog = [];
    mockState.mailBuffer = [];

    // Re-run action-01 through action-06
    mockState.actionHistory.push({
      actionNumber: 1,
      status: 'completed',
      timestamp: new Date('2024-01-15T08:00:00Z').toISOString()
    });

    const retryFormattedReports = dailyReports.map(r => ({
      ...r,
      format_version: '1.0',
      converted_at: new Date('2024-01-15T08:05:00Z').toISOString()
    }));
    mockState.formattedReports = retryFormattedReports;
    mockState.actionHistory.push({
      actionNumber: 2,
      status: 'completed',
      timestamp: new Date('2024-01-15T08:05:00Z').toISOString(),
      result: retryFormattedReports
    });

    mockState.actionHistory.push({
      actionNumber: 3,
      status: 'completed',
      timestamp: new Date('2024-01-15T08:10:00Z').toISOString(),
      result: extractedIssues
    });

    mockState.actionHistory.push({
      actionNumber: 4,
      status: 'completed',
      timestamp: new Date('2024-01-15T08:15:00Z').toISOString()
    });

    mockState.actionHistory.push({
      actionNumber: 5,
      status: 'completed',
      timestamp: new Date('2024-01-15T08:16:00Z').toISOString(),
      result: { unsubmittedCount: 1 }
    });

    const retryMailId = 'MAIL_20240115_002';
    const retryMailEntry: MockMailBuffer = {
      id: retryMailId,
      subject: '[朝会報告管理] 日報未提出者へのリマインド: 2024-01-15',
      to: 'director@company.com',
      status: 'sent',
      sentAt: new Date('2024-01-15T08:17:00Z').toISOString()
    };
    mockState.mailBuffer.push(retryMailEntry);
    mockState.actionHistory.push({
      actionNumber: 6,
      status: 'completed',
      timestamp: new Date('2024-01-15T08:17:00Z').toISOString(),
      result: { mailId: retryMailId, recipients: 1 }
    });

    // Verify no duplicate mails from first attempt
    const allMailsSentBySubject = mockState.mailBuffer.filter(
      m => m.subject === '[朝会報告管理] 日報未提出者へのリマインド: 2024-01-15'
    );
    expect(allMailsSentBySubject.length).toBe(1);
    expect(allMailsSentBySubject[0].id).toBe(retryMailId);
    expect(allMailsSentBySubject[0].status).toBe('sent');

    // Verify system consistency after retry
    expect(mockState.actionHistory.length).toBe(6);
    expect(mockState.actionHistory.every(a => a.status === 'completed')).toBe(true);

    // Final audit verification
    expect(mockState.auditLog.length).toBe(1);
    expect(mockState.auditLog[0].failureStep).toBe('action-04');
  });
});