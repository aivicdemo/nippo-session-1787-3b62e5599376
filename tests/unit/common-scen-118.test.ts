import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6AgentInput, Tx6AgentOutput } from '../../src/agents/tx-6-imp-1/types';
import type { Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/ai-client';

describe('TX6 日報収集から分析レポート生成までの自動実行 - AI出力検証', () => {
  let mockAiClient: jest.Mocked<Tx6Imp1AiClient>;
  let auditLogs: Array<{ event: string; timestamp: Date; details: unknown }>;

  beforeEach(() => {
    auditLogs = [];

    mockAiClient = {
      executeAction01: jest.fn(),
      executeAction02: jest.fn(),
      executeAction03: jest.fn(),
      executeAction04: jest.fn(),
      executeAction05: jest.fn(),
      executeAction06: jest.fn(),
      executeAction07: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-118
  it('should detect malformed AI output and safely escalate without executing subsequent actions', async () => {
    const executionTimestamp = new Date('2024-01-08T09:00:00Z');
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-07';
    const teamId = 'team-001';

    const input: Tx6AgentInput = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    // Mock Action 1 (日報収集) to return malformed output with missing required field
    mockAiClient.executeAction01.mockResolvedValueOnce({
      action: 'collect_reports',
      collectedReportIds: ['report-001', 'report-002'],
      collectionTimestamp: new Date('2024-01-08T09:05:00Z'),
      unsubmittedMembers: ['member-003', 'member-004'],
      // ❌ Missing required field: totalReportCount
      // totalReportCount intentionally omitted
    });

    // Action 2, 3, 4, 5, 6, 7 should NOT be called if validation fails
    mockAiClient.executeAction02.mockResolvedValueOnce({
      action: 'extract_issues',
      extractedIssues: [],
      extractionTimestamp: new Date('2024-01-08T09:10:00Z'),
    });

    mockAiClient.executeAction03.mockResolvedValueOnce({
      action: 'classify_issues',
      classifiedIssues: [],
      classificationTimestamp: new Date('2024-01-08T09:15:00Z'),
    });

    mockAiClient.executeAction04.mockResolvedValueOnce({
      action: 'analyze_trends',
      trendAnalysis: {},
      analysisTimestamp: new Date('2024-01-08T09:20:00Z'),
    });

    mockAiClient.executeAction05.mockResolvedValueOnce({
      action: 'score_priorities',
      priorityScores: [],
      scoringTimestamp: new Date('2024-01-08T09:25:00Z'),
    });

    mockAiClient.executeAction06.mockResolvedValueOnce({
      action: 'generate_report',
      reportContent: '',
      reportGeneratedAt: new Date('2024-01-08T09:30:00Z'),
    });

    mockAiClient.executeAction07.mockResolvedValueOnce({
      action: 'distribute_report',
      distributionTimestamp: new Date('2024-01-08T09:35:00Z'),
      recipientCount: 0,
    });

    // Inject audit logger mock
    const auditLogger = (event: string, details: unknown) => {
      auditLogs.push({
        event,
        timestamp: new Date('2024-01-08T09:00:00Z'),
        details,
      });
    };

    const output = await runTx6Imp1Agent(input, mockAiClient, auditLogger);

    // Assertions: Validation should detect missing field and escalate
    expect(output.escalationFlag).toBe(true);
    expect(output.escalationReason).toMatch(/必須フィールド|totalReportCount|JSON スキーマ/i);

    // Action 1 (日報収集) should have been called
    expect(mockAiClient.executeAction01).toHaveBeenCalledTimes(1);

    // Subsequent actions should NOT have been called due to escalation
    expect(mockAiClient.executeAction02).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction03).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction04).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction05).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction06).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction07).not.toHaveBeenCalled();

    // Verify audit log recorded validation failure and escalation
    const validationFailureLog = auditLogs.find(
      (log) => log.event === 'AI_OUTPUT_VALIDATION_FAILED'
    );
    expect(validationFailureLog).toBeDefined();
    expect(validationFailureLog?.details).toEqual(
      expect.objectContaining({
        action: 'collect_reports',
        reason: expect.stringMatching(/必須フィールド|totalReportCount/i),
      })
    );

    const escalationLog = auditLogs.find(
      (log) => log.event === 'ESCALATION_TRIGGERED'
    );
    expect(escalationLog).toBeDefined();
    expect(escalationLog?.details).toEqual(
      expect.objectContaining({
        escalationCondition: '分析結果に矛盾や異常値が含まれる場合',
        action: 'collect_reports',
      })
    );

    // Report should remain in pending state, not distributed
    expect(output.reportId).toBeUndefined();
    expect(output.reportGeneratedAt).toBeUndefined();
    expect(output.emailSentAt).toBeUndefined();
  });

  // Additional test case: Low confidence score escalation
  it('should escalate when AI output confidenceScore is below 0.7 threshold', async () => {
    const executionTimestamp = new Date('2024-01-08T09:00:00Z');
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-07';
    const teamId = 'team-001';

    const input: Tx6AgentInput = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    // Mock Action 1 with low confidence score
    mockAiClient.executeAction01.mockResolvedValueOnce({
      action: 'collect_reports',
      collectedReportIds: ['report-001', 'report-002'],
      collectionTimestamp: new Date('2024-01-08T09:05:00Z'),
      unsubmittedMembers: ['member-003', 'member-004'],
      totalReportCount: 10,
      confidenceScore: 0.65, // ❌ Below 0.7 threshold
    });

    const auditLogger = (event: string, details: unknown) => {
      auditLogs.push({
        event,
        timestamp: new Date('2024-01-08T09:00:00Z'),
        details,
      });
    };

    const output = await runTx6Imp1Agent(input, mockAiClient, auditLogger);

    expect(output.escalationFlag).toBe(true);
    expect(output.escalationReason).toMatch(/信頼度|confidence/i);

    // Only Action 1 should be called
    expect(mockAiClient.executeAction01).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction02).not.toHaveBeenCalled();

    const confidenceLog = auditLogs.find(
      (log) => log.event === 'AI_OUTPUT_VALIDATION_FAILED'
    );
    expect(confidenceLog?.details).toEqual(
      expect.objectContaining({
        reason: expect.stringMatching(/信頼度|confidence/i),
      })
    );
  });

  // Additional test case: Contradictory classification escalation
  it('should escalate when AI output contains contradictory issue classifications', async () => {
    const executionTimestamp = new Date('2024-01-08T09:00:00Z');
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-07';
    const teamId = 'team-001';

    const input: Tx6AgentInput = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    // Mock successful Action 1
    mockAiClient.executeAction01.mockResolvedValueOnce({
      action: 'collect_reports',
      collectedReportIds: ['report-001'],
      collectionTimestamp: new Date('2024-01-08T09:05:00Z'),
      unsubmittedMembers: [],
      totalReportCount: 5,
      confidenceScore: 0.85,
    });

    // Mock Action 2 (issue extraction) - success
    mockAiClient.executeAction02.mockResolvedValueOnce({
      action: 'extract_issues',
      extractedIssues: [
        {
          issueId: 'issue-001',
          content: 'Database connection timeout',
          extractedAt: new Date('2024-01-08T09:10:00Z'),
        },
      ],
      extractionTimestamp: new Date('2024-01-08T09:10:00Z'),
      confidenceScore: 0.88,
    });

    // Mock Action 3 (classification) with contradictory data
    mockAiClient.executeAction03.mockResolvedValueOnce({
      action: 'classify_issues',
      classifiedIssues: [
        {
          issueId: 'issue-001',
          primaryCategory: 'infrastructure',
          secondaryCategory: 'infrastructure',
          priority: 'high',
        },
        {
          issueId: 'issue-001', // ❌ Same issue ID but contradictory classification
          primaryCategory: 'application',
          secondaryCategory: 'performance',
          priority: 'low',
        },
      ],
      classificationTimestamp: new Date('2024-01-08T09:15:00Z'),
      hasContradictions: true, // ❌ Explicit contradiction flag
    });

    const auditLogger = (event: string, details: unknown) => {
      auditLogs.push({
        event,
        timestamp: new Date('2024-01-08T09:00:00Z'),
        details,
      });
    };

    const output = await runTx6Imp1Agent(input, mockAiClient, auditLogger);

    expect(output.escalationFlag).toBe(true);
    expect(output.escalationReason).toMatch(/矛盾|contradiction/i);

    // Actions 1 and 2 should be called, but 4+ should not
    expect(mockAiClient.executeAction01).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction02).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction03).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction04).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction05).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction06).not.toHaveBeenCalled();
    expect(mockAiClient.executeAction07).not.toHaveBeenCalled();

    const contradictionLog = auditLogs.find(
      (log) => log.event === 'AI_OUTPUT_VALIDATION_FAILED'
    );
    expect(contradictionLog?.details).toEqual(
      expect.objectContaining({
        reason: expect.stringMatching(/矛盾|分類/i),
      })
    );
  });

  // Additional test case: Malformed JSON schema escalation
  it('should escalate when AI output has invalid JSON schema structure', async () => {
    const executionTimestamp = new Date('2024-01-08T09:00:00Z');
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-07';
    const teamId = 'team-001';

    const input: Tx6AgentInput = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    // Mock Action 1 with invalid type for required field
    mockAiClient.executeAction01.mockResolvedValueOnce({
      action: 'collect_reports',
      collectedReportIds: 'invalid-should-be-array', // ❌ Should be array, got string
      collectionTimestamp: new Date('2024-01-08T09:05:00Z'),
      unsubmittedMembers: ['member-003'],
      totalReportCount: 10,
      confidenceScore: 0.82,
    } as any);

    const auditLogger = (event: string, details: unknown) => {
      auditLogs.push({
        event,
        timestamp: new Date('2024-01-08T09:00:00Z'),
        details,
      });
    };

    const output = await runTx6Imp1Agent(input, mockAiClient, auditLogger);

    expect(output.escalationFlag).toBe(true);
    expect(output.escalationReason).toMatch(/スキーマ|型|type/i);

    // Only Action 1 should be called
    expect(mockAiClient.executeAction01).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction02).not.toHaveBeenCalled();

    const schemaLog = auditLogs.find(
      (log) => log.event === 'AI_OUTPUT_VALIDATION_FAILED'
    );
    expect(schemaLog?.details).toEqual(
      expect.objectContaining({
        reason: expect.stringMatching(/スキーマ|型/i),
      })
    );

    // Verify no report was generated or distributed
    expect(output.reportId).toBeUndefined();
    expect(output.reportGeneratedAt).toBeUndefined();
  });

  // Additional test case: State persists with escalation flag set
  it('should persist state with escalationFlag=true and prevent further processing', async () => {
    const executionTimestamp = new Date('2024-01-08T09:00:00Z');
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-07';
    const teamId = 'team-001';

    const input: Tx6AgentInput = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    // Mock Action 1 with missing required field
    mockAiClient.executeAction01.mockResolvedValueOnce({
      action: 'collect_reports',
      collectedReportIds: ['report-001'],
      collectionTimestamp: new Date('2024-01-08T09:05:00Z'),
      unsubmittedMembers: [],
      // ❌ Missing: totalReportCount
    } as any);

    const auditLogger = (event: string, details: unknown) => {
      auditLogs.push({
        event,
        timestamp: new Date('2024-01-08T09:00:00Z'),
        details,
      });
    };

    const output = await runTx6Imp1Agent(input, mockAiClient, auditLogger);

    // Verify escalation state
    expect(output.escalationFlag).toBe(true);
    expect(output.reportPendingManualReview).toBe(true);

    // Verify no report was created
    expect(output.reportId).toBeUndefined();
    expect(output.extractedIssueCount).toBeUndefined();
    expect(output.topPriorityIssues).toBeUndefined();

    // Verify audit trail
    expect(auditLogs.length).toBeGreaterThan(0);
    const escalationEvent = auditLogs.find(
      (log) => log.event === 'ESCALATION_TRIGGERED'
    );
    expect(escalationEvent).toBeDefined();

    // Verify pipeline stopped - no report distribution
    expect(output.emailSentAt).toBeUndefined();
  });
});