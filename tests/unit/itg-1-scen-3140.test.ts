import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import type {
  Tx4AgentExecutionRequest,
  Tx4AgentExecutionResult,
  CountermeasurePlan,
  PrioritizedIssue,
} from '../../src/agents/tx-4-imp-1/orchestrator';

describe('TX4 AIエージェント - 不正・曖昧・低確信度AI出力の安全な拒否', () => {
  // SCEN-3140
  test('AIエージェントが不正・曖昧・低確信度のAI出力を検出して処理を中断し、エスカレーション条件を記録する', async () => {
    const executionId = 'tx4-exec-20260115-001';
    const teamId = 'team-dev-001';
    const managerId = 'mgr-001';
    const reportDate = '2026-01-15';
    const meetingStartTime = '09:00';

    const request: Tx4AgentExecutionRequest = {
      teamId,
      managerId,
      reportDate,
      meetingStartTime,
    };

    // リアルタイム進捗データ集約用スタブデータ（正常形式）
    const aggregatedReportCount = 10;
    const realTimeProgressData = {
      reports: [
        {
          reportId: 'r1',
          memberId: 'm1',
          yestrdayDone: 'Completed feature A',
          todayPlan: 'Start feature B',
          issue: 'Database connection timeout occurred twice',
        },
        {
          reportId: 'r2',
          memberId: 'm2',
          yestrdayDone: 'Fixed bug in API',
          todayPlan: 'Code review',
          issue: 'Database connection timeout',
        },
        {
          reportId: 'r3',
          memberId: 'm3',
          yestrdayDone: 'Testing module X',
          todayPlan: 'Deploy to staging',
          issue: 'Memory leak in subprocess',
        },
      ],
      unsubmittedMembers: ['m4', 'm5'],
    };

    // extractIssuesが不正なJSON（キーが欠落）を返すモック
    const mockAiClientWithMalformedExtract: Tx4Imp1AiClient = {
      extractIssues: jest.fn().mockResolvedValue({
        issues: [
          {
            keyword: 'Database connection timeout',
            // 意図的に frequency フィールドを欠落させる（不正形式）
            confidence: 0.85,
          },
        ],
      }),
      prioritizeIssues: jest.fn().mockResolvedValue({
        prioritized: [],
      }),
      generateRecommendation: jest.fn().mockResolvedValue({
        recommendation: {},
      }),
    };

    // prioritizeIssuesが曖昧な優先度値（-1や101など無効範囲）を返すモック
    const mockAiClientWithAmbiguousPriority: Tx4Imp1AiClient = {
      extractIssues: jest.fn().mockResolvedValue({
        issues: [
          {
            keyword: 'Database connection timeout',
            frequency: 5,
            confidence: 0.85,
          },
        ],
      }),
      prioritizeIssues: jest.fn().mockResolvedValue({
        prioritized: [
          {
            keyword: 'Database connection timeout',
            priorityScore: -1, // 無効範囲の値
            severity: 'high',
            confidence: 0.80,
          },
        ],
      }),
      generateRecommendation: jest.fn().mockResolvedValue({
        recommendation: {},
      }),
    };

    // generateRecommendationが信度スコア0.3未満の低確信度で返すモック
    const mockAiClientWithLowConfidence: Tx4Imp1AiClient = {
      extractIssues: jest.fn().mockResolvedValue({
        issues: [
          {
            keyword: 'Database connection timeout',
            frequency: 5,
            confidence: 0.85,
          },
        ],
      }),
      prioritizeIssues: jest.fn().mockResolvedValue({
        prioritized: [
          {
            keyword: 'Database connection timeout',
            priorityScore: 85,
            severity: 'high',
            confidence: 0.80,
          },
        ],
      }),
      generateRecommendation: jest.fn().mockResolvedValue({
        recommendation: {
          topPriorityIssue: 'Database connection timeout',
          recommendedActions: ['Increase connection pool size', 'Add retry logic'],
          estimatedResolutionDays: 2,
          assignedTeamId: teamId,
          confidence: 0.25, // 0.3未満の低確信度
        },
      }),
    };

    // テスト1: 不正JSON（キーが欠落）を拒否
    const resultMalformed = await runTx4Imp1Agent(
      realTimeProgressData,
      mockAiClientWithMalformedExtract
    );

    expect(resultMalformed).toBeDefined();
    expect(resultMalformed.executionId).toBeDefined();
    expect(resultMalformed.escalationStatus).toMatch(/ambiguous|malformed|invalid/);
    expect(resultMalformed.warningMessage).toMatch(
      /管理者|手動確認|自動判定が不可能/
    );
    expect(resultMalformed.prioritizedIssues).toEqual([]);
    expect(resultMalformed.countermeasurePlan).toBeUndefined();
    expect(resultMalformed.auditLog).toBeDefined();
    if (resultMalformed.auditLog) {
      expect(resultMalformed.auditLog.escalationReason).toMatch(/不正|欠落/);
      expect(resultMalformed.auditLog.timestamp).toBeDefined();
      expect(resultMalformed.auditLog.agentId).toBeDefined();
      expect(resultMalformed.auditLog.problemDetails).toMatch(/frequency|キー/);
    }

    // テスト2: 曖昧な優先度値（-1など）を拒否
    const resultAmbiguousPriority = await runTx4Imp1Agent(
      realTimeProgressData,
      mockAiClientWithAmbiguousPriority
    );

    expect(resultAmbiguousPriority).toBeDefined();
    expect(resultAmbiguousPriority.escalationStatus).toMatch(/ambiguous/);
    expect(resultAmbiguousPriority.warningMessage).toMatch(
      /管理者|手動確認|自動判定が不可能/
    );
    expect(resultAmbiguousPriority.prioritizedIssues).toEqual([]);
    expect(resultAmbiguousPriority.countermeasurePlan).toBeUndefined();
    expect(resultAmbiguousPriority.auditLog).toBeDefined();
    if (resultAmbiguousPriority.auditLog) {
      expect(resultAmbiguousPriority.auditLog.escalationReason).toMatch(
        /範囲外|無効|優先度/
      );
      expect(resultAmbiguousPriority.auditLog.problemDetails).toMatch(/-1|101|0-100/);
    }

    // テスト3: 信度0.3未満の低確信度を拒否
    const resultLowConfidence = await runTx4Imp1Agent(
      realTimeProgressData,
      mockAiClientWithLowConfidence
    );

    expect(resultLowConfidence).toBeDefined();
    expect(resultLowConfidence.escalationStatus).toMatch(/low_confidence|ambiguous/);
    expect(resultLowConfidence.warningMessage).toMatch(
      /管理者|手動確認|自動判定が不可能/
    );
    // 低確信度で拒否されるため、朝会資料が生成されない（countermeasurePlanが undefined）
    expect(resultLowConfidence.countermeasurePlan).toBeUndefined();
    expect(resultLowConfidence.auditLog).toBeDefined();
    if (resultLowConfidence.auditLog) {
      expect(resultLowConfidence.auditLog.escalationReason).toMatch(
        /信度|確信度|低確信度/
      );
      expect(resultLowConfidence.auditLog.problemDetails).toMatch(/0.25|0.3|信度/);
    }

    // TextAnalysisServiceAdapterが呼び出されていないことを確認（処理が早期終了）
    expect(mockAiClientWithMalformed.extractIssues).toHaveBeenCalled();
    expect(mockAiClientWithMalformed.prioritizeIssues).not.toHaveBeenCalled();

    // summaryEmailSentは false（朝会資料が完成していないため送信されない）
    expect(resultMalformed.summaryEmailSent).toBe(false);
    expect(resultAmbiguousPriority.summaryEmailSent).toBe(false);
    expect(resultLowConfidence.summaryEmailSent).toBe(false);

    // completionTimestampは記録されている（処理は完了した、ただしエスカレーション）
    expect(resultMalformed.completionTimestamp).toBeDefined();
    expect(resultAmbiguousPriority.completionTimestamp).toBeDefined();
    expect(resultLowConfidence.completionTimestamp).toBeDefined();
  });
});