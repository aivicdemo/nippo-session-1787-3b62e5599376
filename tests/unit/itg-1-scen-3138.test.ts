import { type Tx4Imp1AiClient } from "../../src/agents/tx-4-imp-1/orchestrator";
import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type {
  Tx4AgentExecutionRequest,
  Tx4AgentExecutionResult,
  PrioritizedIssue,
  CountermeasurePlan,
} from '../../src/agents/tx-4-imp-1/types';

describe('tx-4-imp-1: Tx4Imp1Agent - Dashboard Analysis to Issue Direction', () => {
  // SCEN-3138: [error] ダッシュボード分析から課題指示までの自動実行 AIエージェント - 「ダッシュボード分析から課題指示までの自動実行」が「AIが優先順位を判定できない曖昧な案件の場合」の場合に副作用の確定前に人へ引き継ぐ
  test('should escalate to human when AI cannot confidently judge priority due to conflicting rules', async () => {
    const mockAiClient: Tx4Imp1AiClient = {
      // Action 1: リアルタイム進捗データ集約
      async executeAction01_AggregateRealtimeData(input: {
        dashboardSources: Array<{ systemName: string; dataEndpoint: string }>;
      }) {
        return {
          aggregatedData: {
            delayedItems: [
              {
                projectId: 'proj-001',
                taskName: 'API Development',
                delayDays: 3,
                milestone: '2024-01-20',
              },
            ],
            unsubmittedMembers: ['eng-005', 'eng-008'],
            anomalyValues: [
              {
                metricName: 'bug_resolution_rate',
                currentValue: 15,
                historicalAverage: 85,
                deviation: -70,
              },
            ],
          },
        };
      },

      // Action 2: 進捗遅延・未提出・異常値検出
      async executeAction02_DetectIssues(input: {
        aggregatedData: object;
      }) {
        return {
          detectedIssues: [
            {
              issueId: 'issue-001',
              category: 'schedule_delay',
              description: 'API Development milestone delay by 3 days',
              severity: 'high',
            },
            {
              issueId: 'issue-002',
              category: 'unsubmitted_report',
              description: '2 members have not submitted daily reports',
              severity: 'medium',
            },
            {
              issueId: 'issue-003',
              category: 'quality_anomaly',
              description: 'Bug resolution rate dropped 70% from historical average',
              severity: 'high',
            },
          ],
        };
      },

      // Action 3: 過去事例照合
      async executeAction03_MatchHistoricalCases(input: {
        detectedIssues: Array<{ issueId: string; category: string }>;
      }) {
        return {
          matchedCases: [
            {
              issueId: 'issue-001',
              historicalCaseId: 'case-2023-042',
              similarityScore: 0.78,
              pastResolutionDays: 5,
            },
            {
              issueId: 'issue-003',
              historicalCaseId: 'case-2023-089',
              similarityScore: 0.62,
              pastResolutionDays: 7,
            },
          ],
        };
      },

      // Action 4: 優先度自動判定
      async executeAction04_AutoPrioritize(input: {
        detectedIssues: Array<object>;
        matchedCases: Array<object>;
      }) {
        return {
          prioritizedIssues: [
            {
              issueId: 'issue-001',
              priority: 1,
              scoreBreakdown: { urgency: 85, impact: 90, frequency: 45 },
            },
            {
              issueId: 'issue-003',
              priority: 2,
              scoreBreakdown: { urgency: 80, impact: 88, frequency: 52 },
            },
            {
              issueId: 'issue-002',
              priority: 3,
              scoreBreakdown: { urgency: 60, impact: 50, frequency: 70 },
            },
          ],
        };
      },

      // Action 5: 推奨対応方針生成（AIが低信頼度を返す）
      async executeAction05_GenerateCountermeasure(input: {
        prioritizedIssues: Array<object>;
      }) {
        return {
          status: 'AMBIGUOUS',
          confidence: 0.45,
          conflictingRules: [
            'schedule_recovery_protocol_v2 vs schedule_recovery_protocol_v1',
            'quality_improvement_emergency_path vs quality_improvement_standard_path',
          ],
          ambiguousIssues: [
            {
              issueId: 'issue-001',
              confidence: 0.48,
              conflictingRules: [
                'schedule_recovery_protocol_v2 vs schedule_recovery_protocol_v1',
              ],
            },
            {
              issueId: 'issue-003',
              confidence: 0.42,
              conflictingRules: [
                'quality_improvement_emergency_path vs quality_improvement_standard_path',
              ],
            },
          ],
        };
      },

      // Action 6 & 7 should not be called
      async executeAction06_GenerateMorningMeetingMaterials(input: object) {
        throw new Error('Action 6 should not be executed during escalation');
      },

      async executeAction07_NotifyUnsubmittedMembers(input: object) {
        throw new Error('Action 7 should not be executed during escalation');
      },
    };

    const request: Tx4AgentExecutionRequest = {
      teamId: 'team-dev-001',
      managerId: 'mgr-lead-001',
      reportDate: '2024-01-18',
      meetingStartTime: '09:00',
    };

    const result = await runTx4Imp1Agent(request, mockAiClient);

    // 主アサーション: エスカレーション状態を返すこと
    expect(result.status).toBe('ESCALATED_TO_HUMAN');
    expect(result.escalationReason).toBe(
      'AIが優先順位を判定できない曖昧な案件'
    );

    // 曖昧な案件の詳細
    expect(Array.isArray(result.ambiguousIssues)).toBe(true);
    expect(result.ambiguousIssues?.length).toBe(2);

    const ambiguousIssue1 = result.ambiguousIssues?.[0];
    expect(ambiguousIssue1?.issueId).toBe('issue-001');
    expect(ambiguousIssue1?.confidence).toBe(0.48);
    expect(Array.isArray(ambiguousIssue1?.conflictingRules)).toBe(true);
    expect(ambiguousIssue1?.conflictingRules?.length).toBeGreaterThanOrEqual(1);

    const ambiguousIssue2 = result.ambiguousIssues?.[1];
    expect(ambiguousIssue2?.issueId).toBe('issue-003');
    expect(ambiguousIssue2?.confidence).toBe(0.42);

    // 未確定アクションの確認
    expect(Array.isArray(result.pendingActions)).toBe(true);
    expect(result.pendingActions?.sort()).toEqual(
      ['action-05', 'action-06', 'action-07'].sort()
    );

    // 副作用が実行されなかったことを確認：
    // countermeasurePlan は生成されていない、または null/undefined
    expect(result.countermeasurePlan).toBeUndefined();

    // summaryEmailSent は false のままであること
    expect(result.summaryEmailSent).toBe(false);

    // 監査ログには ESCALATION_EVENT が記録されていること
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog?.find((log: object) =>
      JSON.stringify(log).includes('ESCALATION_EVENT')
    )).toBeDefined();
    expect(
      result.auditLog?.find(
        (log: object) =>
          JSON.stringify(log).includes('ESCALATION_EVENT') &&
          JSON.stringify(log).includes('ambiguous_priority_judgment')
      )
    ).toBeDefined();

    // executionId が生成されていること
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);

    // completionTimestamp が記録されていること（ISO 8601形式）
    expect(result.completionTimestamp).toBeDefined();
    if (result.completionTimestamp instanceof Date) {
      expect(result.completionTimestamp.getTime()).toBeLessThanOrEqual(
        new Date().getTime()
      );
    }
  });
});