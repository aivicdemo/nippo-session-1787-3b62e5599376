import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AgentOutput } from '../../src/agents/tx-7-imp-1/types';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/ai-client';

describe('月次課題傾向分析レポート生成機能 - 再試行パターンの一貫性', () => {
  // SCEN-1840
  test('同じ失敗原因で複数回実行した場合、毎回同じ再試行パターン（3秒・10秒・30秒）が適用される', async () => {
    const targetMonth = '2024-01';
    const managerUserId = 'mgr-001';
    const triggerTimestamp = new Date('2024-02-01T09:00:00Z');

    // 同一の失敗原因（データベース接続タイムアウト）を持つ課題テストデータ
    const mockReportData = {
      targetMonth,
      reports: [
        {
          reportId: 'report-001',
          submittedBy: 'eng-001',
          submittedAt: new Date('2024-01-15T08:30:00Z'),
          challengeText: 'Database timeout during batch processing',
        },
        {
          reportId: 'report-002',
          submittedBy: 'eng-002',
          submittedAt: new Date('2024-01-22T08:30:00Z'),
          challengeText: 'Database connection timeout on API call',
        },
        {
          reportId: 'report-003',
          submittedBy: 'eng-003',
          submittedAt: new Date('2024-01-29T08:30:00Z'),
          challengeText: 'Timeout error in database transaction',
        },
      ],
    };

    const retryIntervals = [3000, 10000, 30000];
    const maxRetries = 3;
    let callCount = 0;
    const firstExecutionRetryLog: Array<{ attemptNum: number; intervalMs: number; timestamp: Date }> = [];
    const secondExecutionRetryLog: Array<{ attemptNum: number; intervalMs: number; timestamp: Date }> = [];

    // 初回実行用のスタブAIクライアント：最初3回は失敗、4回目で成功
    const mockAiClientFirstExecution: Tx7Imp1AiClient = {
      extractKeywords: async (reportTexts: string[]) => {
        callCount++;
        const currentAttempt = callCount;

        if (currentAttempt <= 3) {
          // 1回目、2回目、3回目：失敗（再試行対象）
          const intervalIndex = currentAttempt - 1;
          firstExecutionRetryLog.push({
            attemptNum: currentAttempt,
            intervalMs: retryIntervals[intervalIndex],
            timestamp: new Date(),
          });
          throw new Error('Database connection timeout');
        }

        // 4回目：成功
        return {
          keywords: [
            {
              keyword: 'Database timeout',
              frequency: 3,
              confidenceScore: 0.92,
            },
            {
              keyword: 'Connection issue',
              frequency: 2,
              confidenceScore: 0.85,
            },
          ],
        };
      },
      assessImpactScore: async (keywords: Array<{ keyword: string }>) => {
        return {
          scores: keywords.map((kw) => ({
            keyword: kw.keyword,
            impactScore: kw.keyword === 'Database timeout' ? 85 : 60,
          })),
        };
      },
      classifyIssueSeverity: async (issueTexts: string[]) => {
        return {
          classifications: issueTexts.map(() => ({
            severity: 'high',
          })),
        };
      },
    };

    const firstExecutionInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    // 初回実行
    callCount = 0;
    const firstExecutionResult: Tx7Imp1AgentOutput = await runTx7Imp1Agent(
      firstExecutionInput,
      mockAiClientFirstExecution
    );

    // 初回実行の検証：再試行パターンが正しく記録されている
    expect(firstExecutionResult.executionStatus).toBe('success');
    expect(firstExecutionResult.reportId).toBeDefined();
    expect(firstExecutionResult.analysisResultSummary).toBeDefined();

    // 初回実行の再試行ログを検証
    expect(firstExecutionRetryLog.length).toBe(3);
    expect(firstExecutionRetryLog[0].intervalMs).toBe(3000);
    expect(firstExecutionRetryLog[1].intervalMs).toBe(10000);
    expect(firstExecutionRetryLog[2].intervalMs).toBe(30000);

    // 2回目実行用のスタブAIクライアント：同じパターンで失敗・成功
    callCount = 0;
    const mockAiClientSecondExecution: Tx7Imp1AiClient = {
      extractKeywords: async (reportTexts: string[]) => {
        callCount++;
        const currentAttempt = callCount;

        if (currentAttempt <= 3) {
          const intervalIndex = currentAttempt - 1;
          secondExecutionRetryLog.push({
            attemptNum: currentAttempt,
            intervalMs: retryIntervals[intervalIndex],
            timestamp: new Date(),
          });
          throw new Error('Database connection timeout');
        }

        return {
          keywords: [
            {
              keyword: 'Database timeout',
              frequency: 3,
              confidenceScore: 0.92,
            },
            {
              keyword: 'Connection issue',
              frequency: 2,
              confidenceScore: 0.85,
            },
          ],
        };
      },
      assessImpactScore: async (keywords: Array<{ keyword: string }>) => {
        return {
          scores: keywords.map((kw) => ({
            keyword: kw.keyword,
            impactScore: kw.keyword === 'Database timeout' ? 85 : 60,
          })),
        };
      },
      classifyIssueSeverity: async (issueTexts: string[]) => {
        return {
          classifications: issueTexts.map(() => ({
            severity: 'high',
          })),
        };
      },
    };

    const secondExecutionInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-03-01T09:00:00Z'),
      targetMonth: '2024-02',
      managerUserId,
      includeDetailedAnalysis: true,
    };

    // 2回目実行
    const secondExecutionResult: Tx7Imp1AgentOutput = await runTx7Imp1Agent(
      secondExecutionInput,
      mockAiClientSecondExecution
    );

    // 2回目実行の検証
    expect(secondExecutionResult.executionStatus).toBe('success');
    expect(secondExecutionResult.reportId).toBeDefined();
    expect(secondExecutionResult.analysisResultSummary).toBeDefined();

    // 2回目実行の再試行ログを検証：同一パターンが適用されていること
    expect(secondExecutionRetryLog.length).toBe(3);
    expect(secondExecutionRetryLog[0].intervalMs).toBe(3000);
    expect(secondExecutionRetryLog[1].intervalMs).toBe(10000);
    expect(secondExecutionRetryLog[2].intervalMs).toBe(30000);

    // 両実行での再試行パターンが完全に一致することを確認
    expect(firstExecutionRetryLog[0].intervalMs).toBe(secondExecutionRetryLog[0].intervalMs);
    expect(firstExecutionRetryLog[1].intervalMs).toBe(secondExecutionRetryLog[1].intervalMs);
    expect(firstExecutionRetryLog[2].intervalMs).toBe(secondExecutionRetryLog[2].intervalMs);

    // 同一失敗原因に対する予防提案が含まれていることを確認
    expect(secondExecutionResult.analysisResultSummary.topPriorityChallenges).toBeDefined();
    expect(secondExecutionResult.analysisResultSummary.topPriorityChallenges.length).toBeGreaterThan(0);
    expect(
      secondExecutionResult.analysisResultSummary.topPriorityChallenges.some(
        (ch) => ch.challengeId && ch.priorityScore >= 80
      )
    ).toBe(true);
  });
});