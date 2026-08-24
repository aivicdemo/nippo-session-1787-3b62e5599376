import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/types';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/ai-client';

describe('朝会報告管理システム - tx-7-imp-1 月次レポート生成エージェント', () => {
  let mockAiClient: jest.Mocked<Tx7Imp1AiClient>;
  let mockNotificationAdapter: any;
  let retryCount: number;

  beforeEach(() => {
    retryCount = 0;

    mockAiClient = {
      callAction01ExtractMonthlyReportScope: jest.fn(),
      callAction02AggregateReportData: jest.fn(),
      callAction03AnalyzeBottleneckTrend: jest.fn(),
      callAction04CalculateTeamMetrics: jest.fn(),
      callAction05DeterminePriorityChallenges: jest.fn(),
      callAction06GenerateReportDocument: jest.fn(),
      callAction07NotifyManager: jest.fn(),
      callAction08HandleEscalation: jest.fn(),
    } as any;

    mockNotificationAdapter = {
      sendNotification: jest.fn(),
      sendAlertToAdmin: jest.fn(),
    };

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // SCEN-1859: [error] 月次課題傾向分析レポート生成 - 3 回再試行後も失敗時にエスカレーション対象の部長ID が null のときエラーになる
  test('should throw ValidationError when manager_user_id is null after 3 retries exhausted', async () => {
    const triggerTimestamp = new Date('2024-01-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = null as any;

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    const retryIntervals = [3000, 10000, 30000];
    let callAttempt = 0;

    mockAiClient.callAction02AggregateReportData.mockImplementation(
      async () => {
        callAttempt++;
        if (callAttempt <= 3) {
          return new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Temporary service unavailable'));
            }, retryIntervals[callAttempt - 1]);
          });
        }
        throw new Error('Service still unavailable');
      }
    );

    mockAiClient.callAction01ExtractMonthlyReportScope.mockResolvedValue({
      reportId: 'report-2024-01-001',
      analysisStartDate: new Date('2024-01-01T00:00:00Z'),
      analysisEndDate: new Date('2024-01-31T23:59:59Z'),
    });

    const agentPromise = runTx7Imp1Agent(agentInput, mockAiClient);

    jest.advanceTimersByTime(43000);

    await expect(agentPromise).rejects.toThrow(/部長ID|manager.*id|null/i);
  });
});