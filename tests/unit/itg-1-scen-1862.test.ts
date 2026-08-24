import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次レポート生成エージェント（tx-7-imp-1）', () => {
  // SCEN-1862
  test('第1回目再試行失敗後、第2段階の待機時間が正確に経過して第2回目再試行が開始される', async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      generateMonthlyAnalysisReport: jest.fn(),
    };

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2023-12',
      managerUserId: 'manager-001',
      includeDetailedAnalysis: true,
    };

    let invocationCount = 0;
    const invocationTimestamps: number[] = [];
    const firstRetryFailureTime = Date.now();

    (mockAiClient.generateMonthlyAnalysisReport as jest.Mock).mockImplementation(
      async () => {
        invocationCount++;
        const currentTime = Date.now();
        invocationTimestamps.push(currentTime);

        if (invocationCount === 1) {
          throw new Error('Initial attempt failed');
        }
        if (invocationCount === 2) {
          throw new Error('First retry failed');
        }
        if (invocationCount === 3) {
          return {
            reportId: 'report-2023-12',
            executionStatus: 'success',
            analysisResultSummary: {
              topPriorityChallenges: [
                {
                  challengeId: 'ch-001',
                  priorityScore: 85,
                  occurrenceFrequency: 3,
                  impactLevel: '高',
                  resolutionDaysAverage: 2,
                },
              ],
              performanceMetrics: {
                averageChallengeResolutionDays: 2.5,
                reportSubmissionRate: 0.92,
                challengeRecurrenceRate: 0.15,
              },
              bottleneckTrend: {
                timeSeriesData: [
                  {
                    date: '2023-12-01',
                    bottleneckSeverity: 6,
                  },
                  {
                    date: '2023-12-31',
                    bottleneckSeverity: 3,
                  },
                ],
                improvementTrend: 'improving',
                recurringIssuePattern: ['database_performance', 'api_timeout'],
              },
            },
            deliveryTimestamp: new Date('2024-01-01T09:10:00Z'),
          };
        }
        throw new Error('Unexpected invocation');
      }
    );

    const result = await runTx7Imp1Agent(agentInput, mockAiClient);

    expect(invocationCount).toBe(3);
    expect(result.executionStatus).toBe('success');
    expect(result.reportId).toBe('report-2023-12');

    const timeDiffFirstToSecond = invocationTimestamps[1] - invocationTimestamps[0];
    const timeDiffSecondToThird = invocationTimestamps[2] - invocationTimestamps[1];

    expect(timeDiffFirstToSecond).toBeGreaterThanOrEqual(4800);
    expect(timeDiffFirstToSecond).toBeLessThanOrEqual(5200);

    expect(timeDiffSecondToThird).toBeGreaterThanOrEqual(14800);
    expect(timeDiffSecondToThird).toBeLessThanOrEqual(15200);

    expect(mockAiClient.generateMonthlyAnalysisReport).toHaveBeenCalledTimes(3);
  });
});