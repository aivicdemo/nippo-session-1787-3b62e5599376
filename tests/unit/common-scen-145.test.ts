import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-01';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-02';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-03';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-04';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-05';
import type { Tx8AgentInput, Tx8AgentOutput } from '../../src/agents/tx-8-imp-1/types';

describe('tx-8-imp-1: Tx8Imp1Agent - 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-145: [normal] AIエージェント - 課題検索から可視化レポート作成までの自動実行が契約どおり実行する

  test('should execute all 5 autonomous actions in correct order with escalation detection and audit logging', async () => {
    // Setup: Mock AI Client implementation
    const mockAiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        payload: {
          issues: [
            {
              issueId: 'ISSUE-001',
              occurredAt: '2024-01-10T09:00:00Z',
              title: 'Database Connection Timeout',
              description: 'Connection pool exhausted during peak hours',
              status: 'RESOLVED'
            },
            {
              issueId: 'ISSUE-002',
              occurredAt: '2024-01-11T10:30:00Z',
              title: 'Memory Leak in Cache Module',
              description: 'Unfreed memory accumulation detected',
              status: 'IN_PROGRESS'
            },
            {
              issueId: 'ISSUE-003',
              occurredAt: '2024-01-12T14:15:00Z',
              title: 'Database Connection Timeout',
              description: 'Same issue recurrence',
              status: 'URGENT'
            }
          ],
          dataQualityScore: 0.85,
          totalIssueCount: 3
        }
      }),
      executeAction02: jest.fn().mockResolvedValue({
        payload: {
          patterns: [
            {
              patternId: 'PATTERN-DB-001',
              occurrenceDatetimeRange: {
                startDate: '2024-01-10T09:00:00Z',
                endDate: '2024-01-12T14:15:00Z'
              },
              recurrenceCount: 2,
              classification: 'DATABASE_PERFORMANCE'
            },
            {
              patternId: 'PATTERN-MEM-001',
              occurrenceDatetimeRange: {
                startDate: '2024-01-11T10:30:00Z',
                endDate: '2024-01-11T10:30:00Z'
              },
              recurrenceCount: 1,
              classification: 'MEMORY_MANAGEMENT'
            }
          ],
          totalPatternCount: 2
        }
      }),
      executeAction03: jest.fn().mockResolvedValue({
        payload: {
          bottlenecks: [
            {
              patternType: 'RESOURCE_SATURATION',
              detectedAt: '2024-01-12T14:15:00Z',
              impactScore: 85,
              rootCauseCandidates: ['Insufficient connection pool size', 'Traffic spike not handled']
            },
            {
              patternType: 'MEMORY_LEAK',
              detectedAt: '2024-01-11T10:30:00Z',
              impactScore: 60,
              rootCauseCandidates: ['Circular reference in cache', 'Missing cleanup in event handler']
            }
          ],
          totalBottleneckCount: 2
        }
      }),
      executeAction04: jest.fn().mockResolvedValue({
        payload: {
          reportId: 'REPORT-2024-01-15-001',
          generatedAt: '2024-01-15T08:00:00Z',
          graphDataUrl: 'https://dashboard.example.com/graphs/report-2024-01-15-001',
          patternStatisticsSummary: {
            totalPatterns: 2,
            patternsByClassification: {
              DATABASE_PERFORMANCE: 1,
              MEMORY_MANAGEMENT: 1
            },
            averageRecurrenceCount: 1.5
          }
        }
      }),
      executeAction05: jest.fn().mockResolvedValue({
        payload: {
          prioritizedIssues: [
            {
              issueId: 'ISSUE-003',
              priorityLevel: 'HIGH',
              highlighted: true,
              title: 'Database Connection Timeout',
              impactScore: 85
            },
            {
              issueId: 'ISSUE-002',
              priorityLevel: 'MEDIUM',
              highlighted: false,
              title: 'Memory Leak in Cache Module',
              impactScore: 60
            },
            {
              issueId: 'ISSUE-001',
              priorityLevel: 'LOW',
              highlighted: false,
              title: 'Database Connection Timeout',
              impactScore: 40
            }
          ],
          highPriorityCount: 1,
          totalPrioritizedCount: 3
        }
      })
    };

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-10',
      analysisPeriodEndDate: '2024-01-15',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10
    };

    // Execute
    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    // Verify: Action 1 - Issue data extraction
    expect(mockAiClient.executeAction01).toHaveBeenCalledTimes(1);
    const action01Call = mockAiClient.executeAction01.mock.calls[0];
    expect(action01Call[0]).toContain('2024-01-10');
    expect(action01Call[0]).toContain('2024-01-15');
    expect(buildAction01Prompt).toBeDefined();
    expect(ACTION_01_PROMPT_VERSION).toBeDefined();

    // Verify: Action 2 - Recurrence pattern analysis
    expect(mockAiClient.executeAction02).toHaveBeenCalledTimes(1);
    const action02Call = mockAiClient.executeAction02.mock.calls[0];
    expect(action02Call).toBeDefined();
    expect(buildAction02Prompt).toBeDefined();
    expect(ACTION_02_PROMPT_VERSION).toBeDefined();

    // Verify: Action 3 - Bottleneck detection
    expect(mockAiClient.executeAction03).toHaveBeenCalledTimes(1);
    const action03Call = mockAiClient.executeAction03.mock.calls[0];
    expect(action03Call).toBeDefined();
    expect(buildAction03Prompt).toBeDefined();
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();

    // Verify: Action 4 - Visualization report generation
    expect(mockAiClient.executeAction04).toHaveBeenCalledTimes(1);
    const action04Call = mockAiClient.executeAction04.mock.calls[0];
    expect(action04Call).toBeDefined();
    expect(buildAction04Prompt).toBeDefined();
    expect(ACTION_04_PROMPT_VERSION).toBeDefined();

    // Verify: Action 5 - High-priority issue extraction and highlighting
    expect(mockAiClient.executeAction05).toHaveBeenCalledTimes(1);
    const action05Call = mockAiClient.executeAction05.mock.calls[0];
    expect(action05Call).toBeDefined();
    expect(buildAction05Prompt).toBeDefined();
    expect(ACTION_05_PROMPT_VERSION).toBeDefined();

    // Verify: Final output structure and values
    expect(result.reportId).toBe('REPORT-2024-01-15-001');
    expect(result.analysisStatus).toBe('completed');
    expect(result.recurringIssueCount).toBe(2);
    expect(result.reportDeliveryStatus).toBe('sent');

    // Verify: Issue counts
    expect(result.totalIssueCount).toBe(3);
    expect(result.totalPatternCount).toBe(2);
    expect(result.totalBottleneckCount).toBe(2);
    expect(result.highPriorityIssueCount).toBe(1);

    // Verify: No escalation in happy path (data quality >= 0.7, no contradictions)
    expect(result.escalations).toEqual([]);

    // Verify: Audit logging
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.length).toBeGreaterThan(0);
    expect(result.auditLog[0]).toContain('Action 1');
    expect(result.auditLog).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Action 1'),
        expect.stringContaining('Action 2'),
        expect.stringContaining('Action 3'),
        expect.stringContaining('Action 4'),
        expect.stringContaining('Action 5')
      ])
    );
  });

  test('should detect DATA_QUALITY_LOW escalation when data quality score below 0.7', async () => {
    const mockAiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        payload: {
          issues: [
            {
              issueId: 'ISSUE-X',
              occurredAt: '2024-01-10T09:00:00Z',
              title: 'Test Issue',
              description: 'Low quality data',
              status: 'UNRESOLVED'
            }
          ],
          dataQualityScore: 0.65,
          totalIssueCount: 1
        }
      }),
      executeAction02: jest.fn().mockResolvedValue({
        payload: {
          patterns: [],
          totalPatternCount: 0
        }
      }),
      executeAction03: jest.fn().mockResolvedValue({
        payload: {
          bottlenecks: [],
          totalBottleneckCount: 0
        }
      }),
      executeAction04: jest.fn().mockResolvedValue({
        payload: {
          reportId: 'REPORT-LOW-QUALITY',
          generatedAt: '2024-01-15T08:00:00Z',
          graphDataUrl: 'https://example.com/graphs/low',
          patternStatisticsSummary: { totalPatterns: 0, patternsByClassification: {}, averageRecurrenceCount: 0 }
        }
      }),
      executeAction05: jest.fn().mockResolvedValue({
        payload: {
          prioritizedIssues: [],
          highPriorityCount: 0,
          totalPrioritizedCount: 0
        }
      })
    };

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-10',
      analysisPeriodEndDate: '2024-01-15',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.escalations).toContainEqual(
      expect.objectContaining({
        escalationFlag: true,
        reasonCode: 'DATA_QUALITY_LOW'
      })
    );
  });

  test('should detect UNCLASSIFIED_PATTERN_DETECTED escalation when new pattern found', async () => {
    const mockAiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        payload: {
          issues: [
            {
              issueId: 'ISSUE-NEW',
              occurredAt: '2024-01-10T09:00:00Z',
              title: 'Novel Issue Type',
              description: 'Unprecedented issue category',
              status: 'UNRESOLVED'
            }
          ],
          dataQualityScore: 0.8,
          totalIssueCount: 1
        }
      }),
      executeAction02: jest.fn().mockResolvedValue({
        payload: {
          patterns: [
            {
              patternId: 'PATTERN-UNKNOWN-999',
              occurrenceDatetimeRange: { startDate: '2024-01-10T09:00:00Z', endDate: '2024-01-10T09:00:00Z' },
              recurrenceCount: 1,
              classification: 'UNCLASSIFIED'
            }
          ],
          totalPatternCount: 1
        }
      }),
      executeAction03: jest.fn().mockResolvedValue({
        payload: {
          bottlenecks: [],
          totalBottleneckCount: 0
        }
      }),
      executeAction04: jest.fn().mockResolvedValue({
        payload: {
          reportId: 'REPORT-UNCLASS',
          generatedAt: '2024-01-15T08:00:00Z',
          graphDataUrl: 'https://example.com/graphs/unclass',
          patternStatisticsSummary: { totalPatterns: 1, patternsByClassification: { UNCLASSIFIED: 1 }, averageRecurrenceCount: 1 }
        }
      }),
      executeAction05: jest.fn().mockResolvedValue({
        payload: {
          prioritizedIssues: [],
          highPriorityCount: 0,
          totalPrioritizedCount: 0
        }
      })
    };

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-10',
      analysisPeriodEndDate: '2024-01-15',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.escalations).toContainEqual(
      expect.objectContaining({
        escalationFlag: true,
        reasonCode: 'UNCLASSIFIED_PATTERN_DETECTED'
      })
    );
  });

  test('should detect URGENT_ISSUE_DETECTED escalation when urgent status with high impact', async () => {
    const mockAiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        payload: {
          issues: [
            {
              issueId: 'ISSUE-URGENT-001',
              occurredAt: '2024-01-12T14:00:00Z',
              title: 'Critical System Failure',
              description: 'Production outage',
              status: 'URGENT'
            }
          ],
          dataQualityScore: 0.9,
          totalIssueCount: 1
        }
      }),
      executeAction02: jest.fn().mockResolvedValue({
        payload: {
          patterns: [],
          totalPatternCount: 0
        }
      }),
      executeAction03: jest.fn().mockResolvedValue({
        payload: {
          bottlenecks: [
            {
              patternType: 'CRITICAL_FAILURE',
              detectedAt: '2024-01-12T14:00:00Z',
              impactScore: 95,
              rootCauseCandidates: ['Total system collapse']
            }
          ],
          totalBottleneckCount: 1
        }
      }),
      executeAction04: jest.fn().mockResolvedValue({
        payload: {
          reportId: 'REPORT-URGENT',
          generatedAt: '2024-01-15T08:00:00Z',
          graphDataUrl: 'https://example.com/graphs/urgent',
          patternStatisticsSummary: { totalPatterns: 0, patternsByClassification: {}, averageRecurrenceCount: 0 }
        }
      }),
      executeAction05: jest.fn().mockResolvedValue({
        payload: {
          prioritizedIssues: [
            {
              issueId: 'ISSUE-URGENT-001',
              priorityLevel: 'HIGH',
              highlighted: true,
              title: 'Critical System Failure',
              impactScore: 95
            }
          ],
          highPriorityCount: 1,
          totalPrioritizedCount: 1
        }
      })
    };

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-10',
      analysisPeriodEndDate: '2024-01-15',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.escalations).toContainEqual(
      expect.objectContaining({
        escalationFlag: true,
        reasonCode: 'URGENT_ISSUE_DETECTED'
      })
    );
  });

  test('should detect ANALYSIS_CONTRADICTION escalation when pattern count mismatch', async () => {
    const mockAiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        payload: {
          issues: [
            {
              issueId: 'ISSUE-001',
              occurredAt: '2024-01-10T09:00:00Z',
              title: 'Issue Type A',
              description: 'First occurrence',
              status: 'RESOLVED'
            },
            {
              issueId: 'ISSUE-002',
              occurredAt: '2024-01-11T10:00:00Z',
              title: 'Issue Type B',
              description: 'Second occurrence',
              status: 'RESOLVED'
            }
          ],
          dataQualityScore: 0.8,
          totalIssueCount: 2
        }
      }),
      executeAction02: jest.fn().mockResolvedValue({
        payload: {
          patterns: [
            {
              patternId: 'PATTERN-A',
              occurrenceDatetimeRange: { startDate: '2024-01-10T09:00:00Z', endDate: '2024-01-10T09:00:00Z' },
              recurrenceCount: 1,
              classification: 'TYPE_A'
            }
          ],
          totalPatternCount: 1
        }
      }),
      executeAction03: jest.fn().mockResolvedValue({
        payload: {
          bottlenecks: [
            {
              patternType: 'PATTERN_A',
              detectedAt: '2024-01-10T09:00:00Z',
              impactScore: 50,
              rootCauseCandidates: ['Cause A']
            },
            {
              patternType: 'PATTERN_B',
              detectedAt: '2024-01-11T10:00:00Z',
              impactScore: 55,
              rootCauseCandidates: ['Cause B']
            }
          ],
          totalBottleneckCount: 2
        }
      }),
      executeAction04: jest.fn().mockResolvedValue({
        payload: {
          reportId: 'REPORT-CONTRADICTION',
          generatedAt: '2024-01-15T08:00:00Z',
          graphDataUrl: 'https://example.com/graphs/contradiction',
          patternStatisticsSummary: { totalPatterns: 1, patternsByClassification: { TYPE_A: 1 }, averageRecurrenceCount: 1 }
        }
      }),
      executeAction05: jest.fn().mockResolvedValue({
        payload: {
          prioritizedIssues: [],
          highPriorityCount: 0,
          totalPrioritizedCount: 0
        }
      })
    };

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-10',
      analysisPeriodEndDate: '2024-01-15',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.escalations).toContainEqual(
      expect.objectContaining({
        escalationFlag: true,
        reasonCode: 'ANALYSIS_CONTRADICTION'
      })
    );
  });

  test('should handle malformed action output and return insufficient_data status', async () => {
    const mockAiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        payload: {
          issues: [],
          dataQualityScore: 0.5,
          totalIssueCount: 0
        }
      }),
      executeAction02: jest.fn().mockResolvedValue({
        payload: {
          patterns: [],
          totalPatternCount: 0
        }
      }),
      executeAction03: jest.fn().mockResolvedValue({
        payload: {
          bottlenecks: [],
          totalBottleneckCount: 0
        }
      }),
      executeAction04: jest.fn().mockResolvedValue({
        payload: null
      }),
      executeAction05: jest.fn().mockResolvedValue({
        payload: {
          prioritizedIssues: [],
          highPriorityCount: 0,
          totalPrioritizedCount: 0
        }
      })
    };

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-10',
      analysisPeriodEndDate: '2024-01-15',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.analysisStatus).toBe('insufficient_data');
  });

  test('should handle action execution error and return failed status', async () => {
    const mockAiClient = {
      executeAction01: jest.fn().mockRejectedValue(new Error('API connection failed')),
      executeAction02: jest.fn(),
      executeAction03: jest.fn(),
      executeAction04: jest.fn(),
      executeAction05: jest.fn()
    };

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-10',
      analysisPeriodEndDate: '2024-01-15',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.analysisStatus).toBe('failed');
    expect(result.reportDeliveryStatus).toBe('failed');
  });

  test('should verify orchestrator boundary - second parameter conforms to Tx8Imp1AiClient', async () => {
    const mockAiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        payload: {
          issues: [],
          dataQualityScore: 0.8,
          totalIssueCount: 0
        }
      }),
      executeAction02: jest.fn().mockResolvedValue({
        payload: { patterns: [], totalPatternCount: 0 }
      }),
      executeAction03: jest.fn().mockResolvedValue({
        payload: { bottlenecks: [], totalBottleneckCount: 0 }
      }),
      executeAction04: jest.fn().mockResolvedValue({
        payload: {
          reportId: 'REPORT-BOUNDARY',
          generatedAt: '2024-01-15T08:00:00Z',
          graphDataUrl: 'https://example.com',
          patternStatisticsSummary: { totalPatterns: 0, patternsByClassification: {}, averageRecurrenceCount: 0 }
        }
      }),
      executeAction05: jest.fn().mockResolvedValue({
        payload: { prioritizedIssues: [], highPriorityCount: 0, totalPrioritizedCount: 0 }
      })
    };

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-10',
      analysisPeriodEndDate: '2024-01-15',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10
    };

    // Type checking: mockAiClient must be assignable to Tx8Imp1AiClient
    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(typeof result.analysisStatus).toBe('string');
    expect(typeof result.recurringIssueCount).toBe('number');
    expect(typeof result.reportDeliveryStatus).toBe('string');
  });

  test('should log all audit events with timestamps and action names', async () => {
    const mockAiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        payload: {
          issues: [
            {
              issueId: 'ISSUE-AUDIT',
              occurredAt: '2024-01-10T09:00:00Z',
              title: 'Audit Test Issue',
              description: 'For audit logging',
              status: 'RESOLVED'
            }
          ],
          dataQualityScore: 0.85,
          totalIssueCount: 1
        }
      }),
      executeAction02: jest.fn().mockResolvedValue({
        payload: { patterns: [], totalPatternCount: 0 }
      }),
      executeAction03: jest.fn().mockResolvedValue({
        payload: { bottlenecks: [], totalBottleneckCount: 0 }
      }),
      executeAction04: jest.fn().mockResolvedValue({
        payload: {
          reportId: 'REPORT-AUDIT',
          generatedAt: '2024-01-15T08:00:00Z',
          graphDataUrl: 'https://example.com',
          patternStatisticsSummary: { totalPatterns: 0, patternsByClassification: {}, averageRecurrenceCount: 0 }
        }
      }),
      executeAction05: jest.fn().mockResolvedValue({
        payload: { prioritizedIssues: [], highPriorityCount: 0, totalPrioritizedCount: 0 }
      })
    };

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: '2024-01-10',
      analysisPeriodEndDate: '2024-01-15',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10
    };

    const result: Tx8AgentOutput = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.auditLog).toBeDefined();
    expect(Array.isArray(result.auditLog)).toBe(true);
    expect(result.auditLog.length).toBeGreaterThanOrEqual(5);

    const logString = result.auditLog.join(' ');
    expect(logString).toContain('Action 1');
    expect(logString).toContain('Action 2');
    expect(logString).toContain('Action 3');
    expect(logString).toContain('Action 4');
    expect(logString).toContain('Action 5');

    result.auditLog.forEach((logEntry) => {
      expect(typeof logEntry).toBe('string');
      expect(logEntry.length).toBeGreaterThan(0);
    });
  });
});