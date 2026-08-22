import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('TX7IMP1_MonthlyReportGenerationAgent', () => {
  // SCEN-126
  test('should execute monthly report generation with data extraction on first day of month', async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      executeAction01: jest.fn(async (prompt: string) => {
        return {
          success: true,
          triggerConfirmed: true,
          timestamp: new Date('2024-01-01T00:00:00Z').toISOString(),
          versionId: 'ACTION_01_PROMPT_VERSION_1.0'
        };
      }),
      executeAction02: jest.fn(async (prompt: string) => {
        return {
          success: true,
          extractedRecordCount: 300,
          totalEmployeeCount: 10,
          dateRangeStart: '2023-12-02',
          dateRangeEnd: '2024-01-01',
          itemsPerReport: 3,
          itemNames: ['yesterday_accomplishment', 'today_plan', 'current_challenge'],
          versionId: 'ACTION_02_PROMPT_VERSION_1.0',
          recordIds: Array.from({ length: 300 }, (_, i) => `record_${i + 1}`)
        };
      }),
      executeAction03: jest.fn(async (prompt: string) => {
        return {
          success: true,
          versionId: 'ACTION_03_PROMPT_VERSION_1.0'
        };
      }),
      executeAction04: jest.fn(async (prompt: string) => {
        return {
          success: true,
          versionId: 'ACTION_04_PROMPT_VERSION_1.0'
        };
      }),
      executeAction05: jest.fn(async (prompt: string) => {
        return {
          success: true,
          versionId: 'ACTION_05_PROMPT_VERSION_1.0'
        };
      }),
      executeAction06: jest.fn(async (prompt: string) => {
        return {
          success: true,
          versionId: 'ACTION_06_PROMPT_VERSION_1.0'
        };
      }),
      executeAction07: jest.fn(async (prompt: string) => {
        return {
          success: true,
          versionId: 'ACTION_07_PROMPT_VERSION_1.0'
        };
      }),
      executeAction08: jest.fn(async (prompt: string) => {
        return {
          success: true,
          versionId: 'ACTION_08_PROMPT_VERSION_1.0'
        };
      })
    };

    const mockReportRequest = {
      targetMonth: '2024-01',
      teamId: 'team_001',
      triggeredBy: 'schedule' as const,
      includeDetailedAnalysis: true
    };

    const mockAuditLog: Array<{ eventType: string; timestamp: string; userId: string; context: Record<string, unknown> }> = [];

    const stubReportingDatabase = {
      reports: new Map<string, { id: string; generatedAt: Date; status: string }>(),
      extractedData: new Map<string, { recordCount: number; dateRange: { start: string; end: string }; itemCount: number }>()
    };

    const result = await runTx7Imp1Agent(
      mockReportRequest,
      mockAiClient,
      {
        onAuditLog: (event: { eventType: string; timestamp: string; userId: string; context: Record<string, unknown> }) => {
          mockAuditLog.push(event);
        },
        onDataExtracted: (data: { recordCount: number; dateRange: { start: string; end: string } }) => {
          stubReportingDatabase.extractedData.set('monthly_2024_01', {
            recordCount: data.recordCount,
            dateRange: data.dateRange,
            itemCount: 3
          });
        }
      }
    );

    expect(result).toBeDefined();
    expect(result.status).toBe('success');

    expect(mockAiClient.executeAction01).toHaveBeenCalled();
    const action01Call = (mockAiClient.executeAction01 as jest.Mock).mock.calls[0];
    expect(action01Call[0]).toContain('ACTION_01');

    expect(mockAiClient.executeAction02).toHaveBeenCalled();
    const action02Call = (mockAiClient.executeAction02 as jest.Mock).mock.calls[0];
    expect(action02Call[0]).toContain('ACTION_02');

    const extractionAuditEvent = mockAuditLog.find(e => e.eventType === 'Action02_DataExtraction_Success');
    expect(extractionAuditEvent).toBeDefined();
    expect(extractionAuditEvent?.timestamp).toBeDefined();
    expect(extractionAuditEvent?.context).toBeDefined();

    const extractedEntry = stubReportingDatabase.extractedData.get('monthly_2024_01');
    expect(extractedEntry).toBeDefined();
    expect(extractedEntry?.recordCount).toBe(300);
    expect(extractedEntry?.dateRange.start).toBe('2023-12-02');
    expect(extractedEntry?.dateRange.end).toBe('2024-01-01');
    expect(extractedEntry?.itemCount).toBe(3);

    expect(result.topPriorityChallenges).toBeDefined();
    expect(Array.isArray(result.topPriorityChallenges)).toBe(true);
    expect(result.bottleneckTrend).toBeDefined();
    expect(result.teamPerformanceMetrics).toBeDefined();
    expect(result.generatedAt).toBeDefined();
    expect(new Date(result.generatedAt).getFullYear()).toBe(2024);
    expect(new Date(result.generatedAt).getMonth()).toBe(0);

    expect(mockAuditLog.some(e => e.eventType === 'Action02_DataExtraction_Success')).toBe(true);

    const errorCheckPassed = !mockAuditLog.some(
      e => e.eventType.includes('DataExtraction_Error') || e.eventType.includes('DataInconsistency')
    );
    expect(errorCheckPassed).toBe(true);
  });
});