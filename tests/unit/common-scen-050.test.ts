import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AgentInput, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('Tx2Imp1Agent - Escalation on encrypted or special format reports', () => {
  // SCEN-050
  it('should escalate and prevent side effects when receiving encrypted or special format reports', async () => {
    const executionTimestamp = new Date('2024-01-15T07:55:00Z');
    const reportingDeadline = new Date('2024-01-15T08:00:00Z');
    const teamId = 'team-001';
    const managerEmail = 'manager@company.com';

    const input: Tx2Imp1AgentInput = {
      executionTimestamp,
      teamId,
      reportingDeadline,
      managerEmail,
    };

    // Mock mail system with encrypted and special format reports
    const mockMailSystem = {
      reports: [
        {
          id: 'report-001',
          sender: 'member-001@company.com',
          receivedAt: new Date('2024-01-15T07:45:00Z'),
          content: 'U2FsdGVkX1/encrypted+content+here==', // AES-256 encrypted
          format: 'encrypted',
          contentType: 'application/octet-stream',
        },
        {
          id: 'report-002',
          sender: 'member-002@company.com',
          receivedAt: new Date('2024-01-15T07:50:00Z'),
          content: '{"@context":"https://json-ld.org/contexts/person.jsonld","@type":"Person","name":"Report"}',
          format: 'json-ld',
          contentType: 'application/ld+json',
        },
      ],
      escalationLog: [] as Array<{ timestamp: Date; to: string; subject: string; reason: string; senderList: string[]; receivedTimestamps: Date[]; metadata: { detectionReason: string } }>,
      confirmationMailLog: [] as Array<{ timestamp: Date; to: string; subject: string }>,
    };

    // Mock AI client
    const mockAiClient: Tx2Imp1AiClient = {
      action01_getReportSubmissionStatus: jest.fn(async () => ({
        submittedCount: 0,
        unsubmittedCount: 2,
        reports: mockMailSystem.reports,
      })),

      action02_convertToUnifiedFormat: jest.fn(async () => ({
        status: 'ERROR',
        reason: 'UNDECODABLE_FORMAT',
        details: 'Encryption detected or unsupported format',
        problemReports: [
          {
            reportId: 'report-001',
            sender: 'member-001@company.com',
            detectionReason: 'AES-256 encryption detected',
          },
          {
            reportId: 'report-002',
            sender: 'member-002@company.com',
            detectionReason: 'JSON-LD format not supported',
          },
        ],
      })),

      action03_extractIssues: jest.fn(),
      action04_classifyIssues: jest.fn(),
      action05_prioritizeIssues: jest.fn(),

      action06_sendConfirmationEmail: jest.fn(),

      escalation_sendEscalationEmail: jest.fn(async (escalationData) => {
        mockMailSystem.escalationLog.push({
          timestamp: new Date(),
          to: escalationData.to,
          subject: escalationData.subject,
          reason: escalationData.reason,
          senderList: escalationData.senderList,
          receivedTimestamps: escalationData.receivedTimestamps,
          metadata: { detectionReason: escalationData.detectionReason },
        });
        return { success: true };
      }),
    };

    // Execute orchestrator
    const result = await runTx2Imp1Agent(input, mockAiClient);

    // Verify escalation occurred
    expect(result.escalated).toBe(true);
    expect(result.escalationReason).toBe('ENCRYPTED_OR_SPECIAL_FORMAT');
    expect(result.sideEffectsApplied).toBe(false);
    expect(result.requiresHumanReview).toBe(true);

    // Verify Action 1 was called
    expect(mockAiClient.action01_getReportSubmissionStatus).toHaveBeenCalledTimes(1);

    // Verify Action 2 was called and returned error
    expect(mockAiClient.action02_convertToUnifiedFormat).toHaveBeenCalledTimes(1);

    // Verify escalation email was sent with correct content
    expect(mockAiClient.escalation_sendEscalationEmail).toHaveBeenCalledTimes(1);
    const escalationCall = (mockAiClient.escalation_sendEscalationEmail as jest.Mock).mock.calls[0];
    expect(escalationCall[0]).toEqual(
      expect.objectContaining({
        to: managerEmail,
        reason: 'ENCRYPTED_OR_SPECIAL_FORMAT',
        senderList: ['member-001@company.com', 'member-002@company.com'],
        detectionReason: expect.stringContaining('encryption') || expect.stringContaining('format'),
      })
    );

    // Verify escalation log was recorded
    expect(mockMailSystem.escalationLog).toHaveLength(1);
    expect(mockMailSystem.escalationLog[0]).toEqual(
      expect.objectContaining({
        reason: 'ENCRYPTED_OR_SPECIAL_FORMAT',
        to: managerEmail,
      })
    );

    // Verify confirmation email was NOT sent (no side effects applied)
    expect(mockAiClient.action06_sendConfirmationEmail).not.toHaveBeenCalled();
    expect(mockMailSystem.confirmationMailLog).toHaveLength(0);

    // Verify Actions 3, 4, 5 were NOT called (processing stopped at Action 2)
    expect(mockAiClient.action03_extractIssues).not.toHaveBeenCalled();
    expect(mockAiClient.action04_classifyIssues).not.toHaveBeenCalled();
    expect(mockAiClient.action05_prioritizeIssues).not.toHaveBeenCalled();
  });
});