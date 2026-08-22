import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行 - AI出力安全性検証', () => {
  // SCEN-153
  test('不正・曖昧・低確信度のAI出力を検出してエスカレーション処理を実行する', async () => {
    const fakeAiClientLowConfidence = {
      executeAction01_ExtractIssueData: jest.fn().mockResolvedValue({
        status: 'success',
        data: {
          issues: [
            { id: 'ISS-001', title: 'Database performance issue', reportedDate: '2024-01-15' },
            { id: 'ISS-002', title: 'API timeout error', reportedDate: '2024-01-14' },
          ],
          confidence: 0.55,
          extractedAt: '2024-01-15T10:00:00Z',
        },
      }),
      executeAction02_AnalyzeRecurrencePattern: jest.fn().mockResolvedValue({
        status: 'malformed',
        error: 'Schema violation: missing required field "patternMetrics"',
        data: {
          patterns: [{ name: 'timeout_recurrence' }],
        },
      }),
      executeAction03_IdentifyBottleneckShift: jest.fn().mockResolvedValue({
        status: 'success',
        data: {
          bottlenecks: [
            { period: 'week1', bottleneck: 'database', severity: 'high' },
            { period: 'week2', bottleneck: 'api', severity: 'high' },
            { period: 'week2', bottleneck: 'database', severity: 'high' },
          ],
          contradictory_result: true,
          analysisAt: '2024-01-15T10:15:00Z',
        },
      }),
      executeAction04_GenerateVisualizationReport: jest.fn(),
      executeAction05_HighlightPrioritizedIssues: jest.fn(),
    };

    const input = {
      analysisPeriodStartDate: '2024-01-08',
      analysisPeriodEndDate: '2024-01-15',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10,
    };

    const auditLog: Array<{
      type: string;
      timestamp: string;
      details: Record<string, unknown>;
    }> = [];

    const recordAuditEvent = (
      type: string,
      details: Record<string, unknown>
    ) => {
      auditLog.push({
        type,
        timestamp: new Date().toISOString(),
        details,
      });
    };

    const result = await runTx8Imp1Agent(input, fakeAiClientLowConfidence);

    expect(result).toBeDefined();
    expect(result.reportId).toBeUndefined();
    expect(result.analysisStatus).toBe('insufficient_confidence');

    expect(fakeAiClientLowConfidence.executeAction01_ExtractIssueData).toHaveBeenCalledTimes(1);
    expect(fakeAiClientLowConfidence.executeAction02_AnalyzeRecurrencePattern).toHaveBeenCalledTimes(1);
    expect(fakeAiClientLowConfidence.executeAction03_IdentifyBottleneckShift).toHaveBeenCalledTimes(1);

    expect(fakeAiClientLowConfidence.executeAction04_GenerateVisualizationReport).not.toHaveBeenCalled();
    expect(fakeAiClientLowConfidence.executeAction05_HighlightPrioritizedIssues).not.toHaveBeenCalled();

    expect(result.escalationRequired).toBe(true);
    expect(result.escalationReason).toMatch(
      /low_confidence|malformed_output|contradictory_result/i
    );

    expect(Array.isArray(result.escalationEvents)).toBe(true);
    if (result.escalationEvents && result.escalationEvents.length > 0) {
      const eventTypes = result.escalationEvents.map((e: { type: string }) => e.type);
      expect(eventTypes.some((t: string) => /low_confidence|malformed|contradictory/.test(t))).toBe(
        true
      );
    }

    expect(result.reportDeliveryStatus).toBe('blocked');
  });
});