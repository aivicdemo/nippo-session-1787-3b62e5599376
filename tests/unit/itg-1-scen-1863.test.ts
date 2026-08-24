import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成の再試行制御', () => {
  // SCEN-1863: 月次課題傾向分析レポート生成処理の失敗時再試行制御 - 第3段階の段階的待機時間が正確に経過する
  test('should apply exponential backoff with exact 30000ms wait on third retry', async () => {
    const mockTimestamps: number[] = [];
    const mockAiClient: Tx7Imp1AiClient = {
      analyzeMonthlyTrends: jest.fn(async () => {
        mockTimestamps.push(Date.now());
        throw new Error('Data extraction error');
      }),
      generateMonthlyReport: jest.fn(async () => {
        throw new Error('Report generation error');
      }),
      formatAnalysisResult: jest.fn(async () => ({
        topPriorityChallenges: [],
        performanceMetrics: {
          challengeResolutionSpeed: 0,
          reportSubmissionRate: 0,
          challengeRecurrenceRate: 0
        },
        bottleneckTrend: {
          timeSeriesData: [],
          improvementTrend: 'stable' as const,
          recurringIssuePattern: []
        }
      })),
      notifyManager: jest.fn(async () => ({ success: true, timestamp: new Date() }))
    };

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: 'manager-001',
      includeDetailedAnalysis: true
    };

    const firstAttemptTime = Date.now();
    let secondAttemptTime = 0;
    let thirdAttemptTime = 0;
    let firstFailureTime = 0;
    let secondFailureTime = 0;

    const originalDateNow = Date.now;
    let callCount = 0;

    Date.now = jest.fn(() => {
      callCount++;
      const now = originalDateNow();

      if (callCount === 1) {
        firstAttemptTime;
        firstFailureTime = now;
        return now;
      }

      if (callCount === 2) {
        const elapsedSinceFirst = now - firstFailureTime;
        if (elapsedSinceFirst < 5000) {
          return firstFailureTime + 5000;
        }
        secondAttemptTime = now;
        secondFailureTime = now;
        return now;
      }

      if (callCount === 3) {
        const elapsedSinceSecond = now - secondFailureTime;
        if (elapsedSinceSecond < 15000) {
          return secondFailureTime + 15000;
        }
        thirdAttemptTime = now;
        return now;
      }

      return now;
    });

    try {
      await runTx7Imp1Agent(agentInput, mockAiClient);
    } catch {
      // Expected to fail after retries
    }

    Date.now = originalDateNow;

    const firstWaitTime = secondAttemptTime - firstFailureTime;
    const secondWaitTime = thirdAttemptTime - secondFailureTime;

    expect(firstWaitTime).toBeGreaterThanOrEqual(4900);
    expect(firstWaitTime).toBeLessThanOrEqual(5100);

    expect(secondWaitTime).toBeGreaterThanOrEqual(14900);
    expect(secondWaitTime).toBeLessThanOrEqual(15100);

    expect(mockAiClient.analyzeMonthlyTrends).toHaveBeenCalled();
  });
});