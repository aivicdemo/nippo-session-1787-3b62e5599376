import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import type { Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';

describe('tx-5-imp-1 orchestrator', () => {
  let mockAiClient: Tx5Imp1AiClient;
  let auditLog: Array<{
    eventType: string;
    timestamp: string;
    userId: string;
    attemptedOperation: string;
    denialReason: string;
  }>;

  beforeEach(() => {
    auditLog = [];
    mockAiClient = {
      dataAccessScope: 'restricted_readonly',
      validateExtractedIssueData: jest.fn(async () => {
        const error = new Error(
          'Access denied: insufficient permission scope for data_type_extracted_issues'
        );
        (error as any).code = 'AUTHORIZATION_DENIED';
        auditLog.push({
          eventType: 'AUTHORIZATION_DENIED',
          timestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
          userId: 'user_general_001',
          attemptedOperation: 'validate_extracted_issue_data',
          denialReason: 'restricted_readonly scope cannot access full extracted issues dataset'
        });
        throw error;
      }),
      determinePriorityAndCategory: jest.fn(),
      executeToolIntegrationConfig: jest.fn(),
      registerToJira: jest.fn(),
      registerToAsana: jest.fn(),
      recordToolIntegrationResult: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-102
  it('should deny authorization when restricted scope attempts to access unauthorized data and tool operations', async () => {
    const testUserId = 'user_general_001';
    const extractedIssueData = [
      {
        issueId: 'extracted_issue_001',
        title: 'Test Issue',
        description: 'Test description',
        reportedBy: 'user_general_001',
        reportDate: '2024-01-15'
      }
    ];
    const toolIntegrationConfig = {
      toolType: 'jira' as const,
      apiEndpoint: 'https://jira.example.com/api/v3',
      credentialId: 'cred_jira_001'
    };
    const priorityRules = {
      frequencyWeight: 0.4,
      impactWeight: 0.6
    };
    const categoryMappings = [
      {
        systemCategory: 'quality',
        jiraCategory: 'Bug',
        asanaCategory: 'Quality Issue'
      }
    ];

    const input = {
      extractedIssueData,
      toolIntegrationConfig,
      priorityRules,
      categoryMappings
    };

    // Action 1 should fail on authorization check
    let authorizationError: Error | null = null;
    try {
      await runTx5Imp1Agent(input, mockAiClient);
    } catch (error) {
      authorizationError = error as Error;
    }

    expect(authorizationError).not.toBeNull();
    expect(authorizationError?.message).toMatch(/Access denied/);
    expect(authorizationError?.message).toMatch(/insufficient permission scope/);
    expect((authorizationError as any)?.code).toBe('AUTHORIZATION_DENIED');

    // Verify mock client methods were called for Action 1 validation attempt
    expect(mockAiClient.validateExtractedIssueData).toHaveBeenCalledWith(
      extractedIssueData
    );

    // Verify that subsequent tool operations (Actions 3-5) were NOT called
    expect(mockAiClient.executeToolIntegrationConfig).not.toHaveBeenCalled();
    expect(mockAiClient.registerToJira).not.toHaveBeenCalled();
    expect(mockAiClient.registerToAsana).not.toHaveBeenCalled();

    // Verify audit log entry
    expect(auditLog).toHaveLength(1);
    const auditEntry = auditLog[0];
    expect(auditEntry.eventType).toBe('AUTHORIZATION_DENIED');
    expect(auditEntry.userId).toBe('user_general_001');
    expect(auditEntry.attemptedOperation).toBe('validate_extracted_issue_data');
    expect(auditEntry.denialReason).toMatch(/restricted_readonly/);
    expect(auditEntry.timestamp).toBe('2024-01-15T09:00:00Z');
  });
});