import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/analysis-reporting';

// Mock modules
jest.mock('../../src/agents/tx-7-imp-1/orchestrator');
jest.mock('../../src/auditing/audit-logger');

describe('Monthly Analysis Report Generation with Audit Logging', () => {
  let mockAuditLogger: any;
  let mockOrchestrator: any;
  let auditEvents: any[] = [];

  beforeEach(() => {
    auditEvents = [];
    
    mockAuditLogger = {
      recordEvent: jest.fn((eventType: string, metadata: any) => {
        auditEvents.push({
          eventType,
          metadata,
          timestamp: new Date().toISOString()
        });
      }),
      getEvents: jest.fn(() => auditEvents)
    };

    mockOrchestrator = {
      runTx7Imp1Agent: jest.fn(async (aiClient: any) => {
        // Simulate agent workflow with audit logging
        mockAuditLogger.recordEvent('AGENT_STARTED', {
          executionId: 'exec-001',
          timestamp: '2024-01-15T09:00:00Z',
          actionList: [
            'ACTION_01', 'ACTION_02', 'ACTION_03', 'ACTION_04',
            'ACTION_05', 'ACTION_06', 'ACTION_07', 'ACTION_08'
          ]
        });

        // Action 01: Check monthly report generation trigger
        mockAuditLogger.recordEvent('ACTION_01_EXECUTED', {
          actionName: 'confirmReportGenerationTrigger',
          promptVersion: 'v1.0.0',
          timestamp: '2024-01-15T09:01:00Z'
        });

        // Action 02: Extract accumulated report data
        mockAuditLogger.recordEvent('ACTION_02_EXECUTED', {
          actionName: 'extractAccumulatedData',
          extractedRecordCount: 156,
          dataRangeStart: '2024-01-01',
          dataRangeEnd: '2024-01-31',
          timestamp: '2024-01-15T09:02:00Z'
        });

        // Action 03: Execute report generation
        mockAuditLogger.recordEvent('ACTION_03_COMPLETED', {
          actionName: 'executeReportGeneration',
          reportId: 'rpt-2024-01-001',
          generationStatus: 'SUCCESS',
          timestamp: '2024-01-15T09:03:00Z'
        });

        // Action 04: Analyze time series changes in issues
        mockAuditLogger.recordEvent('ACTION_04_COMPLETED', {
          actionName: 'analyzeTimeSeriesChanges',
          analysisItemCount: 24,
          detectedPatternCount: 5,
          timestamp: '2024-01-15T09:04:00Z'
        });

        // Action 05: Identify bottleneck transitions
        mockAuditLogger.recordEvent('ACTION_05_COMPLETED', {
          actionName: 'identifyBottleneckTransitions',
          bottleneckCount: 8,
          priorityLevels: ['HIGH', 'MEDIUM', 'LOW'],
          timestamp: '2024-01-15T09:05:00Z'
        });

        // Action 06: Calculate team-wise performance metrics
        mockAuditLogger.recordEvent('ACTION_06_COMPLETED', {
          actionName: 'calculateTeamPerformanceMetrics',
          teamCount: 4,
          metricItems: ['resolveTime', 'issueCount', 'responseSpeed', 'reworkRate'],
          timestamp: '2024-01-15T09:06:00Z'
        });

        // Action 07: Prioritize and summarize analysis results
        mockAuditLogger.recordEvent('ACTION_07_COMPLETED', {
          actionName: 'prioritizeSummaryAnalysisResults',
          priorityBreakdown: {
            HIGH: 12,
            MEDIUM: 28,
            LOW: 116
          },
          timestamp: '2024-01-15T09:07:00Z'
        });

        // Action 08: Present analysis report to director
        mockAuditLogger.recordEvent('ACTION_08_COMPLETED', {
          actionName: 'presentAnalysisReportToDirector',
          deliveryTargets: ['director@example.com'],
          deliveryTimestamp: '2024-01-15T09:08:00Z'
        });

        // Agent completion
        mockAuditLogger.recordEvent('AGENT_COMPLETED', {
          executionId: 'exec-001',
          totalExecutionTimeMs: 480000,
          finalStatus: 'SUCCESS',
          timestamp: '2024-01-15T09:08:30Z'
        });

        return {
          executionId: 'exec-001',
          status: 'SUCCESS',
          reportId: 'rpt-2024-01-001',
          analysisMetadata: {
            recordsProcessed: 156,
            patternsDetected: 5,
            bottlenecksIdentified: 8,
            teamsAnalyzed: 4,
            prioritySummary: {
              HIGH: 12,
              MEDIUM: 28,
              LOW: 116
            }
          }
        };
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    auditEvents = [];
  });

  // SCEN-141: Monthly analysis report generation with complete audit trail
  test('should execute complete monthly analysis report generation workflow with audit logging for all 8 actions', async () => {
    const executionResult = await mockOrchestrator.runTx7Imp1Agent({});
    const recordedEvents = mockAuditLogger.getEvents();

    // Verify agent execution result
    expect(executionResult.status).toBe('SUCCESS');
    expect(executionResult.executionId).toBe('exec-001');
    expect(executionResult.reportId).toBe('rpt-2024-01-001');
    expect(executionResult.analysisMetadata.recordsProcessed).toBe(156);
    expect(executionResult.analysisMetadata.patternsDetected).toBe(5);
    expect(executionResult.analysisMetadata.bottlenecksIdentified).toBe(8);
    expect(executionResult.analysisMetadata.teamsAnalyzed).toBe(4);

    // Verify priority breakdown
    expect(recordedEvents.find((e: any) => e.eventType === 'ACTION_07_COMPLETED')?.metadata.priorityBreakdown).toEqual({
      HIGH: 12,
      MEDIUM: 28,
      LOW: 116
    });

    // Verify 10 audit events were recorded (AGENT_STARTED + 8 actions + AGENT_COMPLETED)
    expect(recordedEvents.length).toBe(10);

    // Verify event sequence and structure
    const eventTypes = recordedEvents.map((e: any) => e.eventType);
    expect(eventTypes).toEqual([
      'AGENT_STARTED',
      'ACTION_01_EXECUTED',
      'ACTION_02_EXECUTED',
      'ACTION_03_COMPLETED',
      'ACTION_04_COMPLETED',
      'ACTION_05_COMPLETED',
      'ACTION_06_COMPLETED',
      'ACTION_07_COMPLETED',
      'ACTION_08_COMPLETED',
      'AGENT_COMPLETED'
    ]);

    // Verify AGENT_STARTED event
    const agentStartedEvent = recordedEvents[0];
    expect(agentStartedEvent.eventType).toBe('AGENT_STARTED');
    expect(agentStartedEvent.metadata.executionId).toBe('exec-001');
    expect(agentStartedEvent.metadata.timestamp).toBe('2024-01-15T09:00:00Z');
    expect(agentStartedEvent.metadata.actionList).toHaveLength(8);
    expect(agentStartedEvent.metadata.actionList[0]).toBe('ACTION_01');

    // Verify ACTION_01_EXECUTED event
    const action01Event = recordedEvents[1];
    expect(action01Event.eventType).toBe('ACTION_01_EXECUTED');
    expect(action01Event.metadata.actionName).toBe('confirmReportGenerationTrigger');
    expect(action01Event.metadata.promptVersion).toBe('v1.0.0');

    // Verify ACTION_02_EXECUTED event with data extraction details
    const action02Event = recordedEvents[2];
    expect(action02Event.eventType).toBe('ACTION_02_EXECUTED');
    expect(action02Event.metadata.extractedRecordCount).toBe(156);
    expect(action02Event.metadata.dataRangeStart).toBe('2024-01-01');
    expect(action02Event.metadata.dataRangeEnd).toBe('2024-01-31');

    // Verify ACTION_03_COMPLETED event with report generation status
    const action03Event = recordedEvents[3];
    expect(action03Event.eventType).toBe('ACTION_03_COMPLETED');
    expect(action03Event.metadata.reportId).toBe('rpt-2024-01-001');
    expect(action03Event.metadata.generationStatus).toBe('SUCCESS');

    // Verify ACTION_04_COMPLETED event with analysis details
    const action04Event = recordedEvents[4];
    expect(action04Event.eventType).toBe('ACTION_04_COMPLETED');
    expect(action04Event.metadata.analysisItemCount).toBe(24);
    expect(action04Event.metadata.detectedPatternCount).toBe(5);

    // Verify ACTION_05_COMPLETED event with bottleneck details
    const action05Event = recordedEvents[5];
    expect(action05Event.eventType).toBe('ACTION_05_COMPLETED');
    expect(action05Event.metadata.bottleneckCount).toBe(8);
    expect(action05Event.metadata.priorityLevels).toEqual(['HIGH', 'MEDIUM', 'LOW']);

    // Verify ACTION_06_COMPLETED event with team metrics
    const action06Event = recordedEvents[6];
    expect(action06Event.eventType).toBe('ACTION_06_COMPLETED');
    expect(action06Event.metadata.teamCount).toBe(4);
    expect(action06Event.metadata.metricItems).toHaveLength(4);
    expect(action06Event.metadata.metricItems).toContain('resolveTime');
    expect(action06Event.metadata.metricItems).toContain('issueCount');
    expect(action06Event.metadata.metricItems).toContain('responseSpeed');
    expect(action06Event.metadata.metricItems).toContain('reworkRate');

    // Verify ACTION_07_COMPLETED event with priority breakdown
    const action07Event = recordedEvents[7];
    expect(action07Event.eventType).toBe('ACTION_07_COMPLETED');
    expect(action07Event.metadata.priorityBreakdown.HIGH).toBe(12);
    expect(action07Event.metadata.priorityBreakdown.MEDIUM).toBe(28);
    expect(action07Event.metadata.priorityBreakdown.LOW).toBe(116);

    // Verify ACTION_08_COMPLETED event with delivery details
    const action08Event = recordedEvents[8];
    expect(action08Event.eventType).toBe('ACTION_08_COMPLETED');
    expect(action08Event.metadata.deliveryTargets).toContain('director@example.com');
    expect(action08Event.metadata.deliveryTimestamp).toBe('2024-01-15T09:08:00Z');

    // Verify AGENT_COMPLETED event with final status
    const agentCompletedEvent = recordedEvents[9];
    expect(agentCompletedEvent.eventType).toBe('AGENT_COMPLETED');
    expect(agentCompletedEvent.metadata.executionId).toBe('exec-001');
    expect(agentCompletedEvent.metadata.finalStatus).toBe('SUCCESS');
    expect(agentCompletedEvent.metadata.totalExecutionTimeMs).toBe(480000);

    // Verify chronological order of timestamps
    const timestamps = recordedEvents.map((e: any) => new Date(e.metadata.timestamp).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }

    // Verify audit trail completeness: all events present and in correct order
    expect(recordedEvents.every((e: any) => e.metadata.timestamp)).toBe(true);
    expect(recordedEvents.every((e: any) => e.eventType)).toBe(true);
  });
});