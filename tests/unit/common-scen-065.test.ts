import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AgentInput, type Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('Tx3Imp1Agent - Escalation on Critical Executive Report', () => {
  // SCEN-065
  test('should halt execution before side effects when critical executive report issue is detected', async () => {
    const now = new Date('2024-01-15T11:00:00Z');
    const aggregatedReportData = `
      [Report 1] Team A - Issue: システムダウンにより全顧客サービス停止。直ちに経営層への報告が必要。
      [Report 2] Team B - Issue: データベース接続タイムアウト
      [Report 3] Team C - Issue: 納期遅延により顧客クレーム発生。経営判断が必要。
    `;

    const mockAiClient: Tx3Imp1AiClient = {
      async action01ExtractKeywords(input: {
        reportText: string;
        executionTime: Date;
      }) {
        return {
          keywords: [
            { keyword: 'システムダウン', frequency: 1, severity: 'critical' },
            { keyword: '全顧客サービス停止', frequency: 1, severity: 'critical' },
            { keyword: 'データベース接続タイムアウト', frequency: 1, severity: 'medium' },
            { keyword: '納期遅延', frequency: 1, severity: 'high' },
            { keyword: '顧客クレーム', frequency: 1, severity: 'high' },
          ],
          extractedAt: input.executionTime,
        };
      },

      async action02ClassifyIssues(input: {
        keywords: Array<{ keyword: string; frequency: number; severity: string }>;
      }) {
        return {
          classified: [
            {
              category: 'infrastructure',
              issues: [
                {
                  id: 'issue-001',
                  title: 'システムダウン',
                  keywords: ['システムダウン', '全顧客サービス停止'],
                  severity: 'critical',
                  requiresExecutiveReport: true,
                },
              ],
            },
            {
              category: 'database',
              issues: [
                {
                  id: 'issue-002',
                  title: 'データベース接続タイムアウト',
                  keywords: ['データベース接続タイムアウト'],
                  severity: 'medium',
                  requiresExecutiveReport: false,
                },
              ],
            },
            {
              category: 'delivery',
              issues: [
                {
                  id: 'issue-003',
                  title: '納期遅延',
                  keywords: ['納期遅延', '顧客クレーム'],
                  severity: 'high',
                  requiresExecutiveReport: true,
                },
              ],
            },
          ],
        };
      },

      async action03AssignPriority(input: {
        classifiedIssues: Array<{
          category: string;
          issues: Array<{
            id: string;
            title: string;
            severity: string;
            requiresExecutiveReport: boolean;
          }>;
        }>;
        priorityThresholds?: {
          highPriorityMinScore: number;
          mediumPriorityMinScore: number;
        };
      }) {
        const criticalExecutiveIssues = input.classifiedIssues
          .flatMap((cat) => cat.issues)
          .filter((issue) => issue.requiresExecutiveReport && issue.severity === 'critical');

        if (criticalExecutiveIssues.length > 0) {
          return {
            prioritized: [
              {
                id: 'issue-001',
                title: 'システムダウン',
                priority: 'HIGH',
                score: 95,
                requiresExecutiveReport: true,
                escalationReason: 'critical_executive_report',
              },
              {
                id: 'issue-003',
                title: '納期遅延',
                priority: 'MEDIUM',
                score: 65,
                requiresExecutiveReport: true,
                escalationReason: 'customer_impact',
              },
              {
                id: 'issue-002',
                title: 'データベース接続タイムアウト',
                priority: 'LOW',
                score: 45,
                requiresExecutiveReport: false,
                escalationReason: undefined,
              },
            ],
            hasExecutiveIssues: true,
            executiveIssueCount: 2,
          };
        }

        return {
          prioritized: [],
          hasExecutiveIssues: false,
          executiveIssueCount: 0,
        };
      },

      async action04GenerateList(input: {
        prioritized: Array<{
          id: string;
          title: string;
          priority: string;
          score: number;
        }>;
      }) {
        throw new Error('SHOULD_NOT_BE_CALLED: action04GenerateList called before escalation handoff');
      },

      async action05SendEmail(input: {
        listContent: string;
        managerEmail: string;
      }) {
        throw new Error('SHOULD_NOT_BE_CALLED: action05SendEmail called after escalation halt');
      },
    };

    const input: Tx3Imp1AgentInput = {
      reportAggregationId: 'agg-20240115-001',
      analysisExecutionTime: now,
      managerEmail: 'manager@company.com',
      priorityThresholds: {
        highPriorityMinScore: 75,
        mediumPriorityMinScore: 50,
      },
    };

    const output = await runTx3Imp1Agent(input, mockAiClient);

    expect(output.escalated).toBe(true);
    expect(output.escalation_reason).toBe('critical_executive_report');
    expect(output.manager_handoff_required).toBe(true);
    expect(output.pending_actions).toEqual(['action-04', 'action-05']);
    expect(output.escalation_timestamp).toBeDefined();
    expect(new Date(output.escalation_timestamp as string).getTime()).toBeGreaterThan(0);
    expect(output.audit_event).toBe('ESCALATION_TRIGGERED: CRITICAL_ISSUE_REQUIRES_HUMAN_REVIEW');
    expect(output.halted_at_action).toBe(3);
    expect(output.executed_actions).toEqual([1, 2, 3]);
    expect(output.emailSendStatus).toBeUndefined();
    expect(output.extractedIssues).toBeDefined();
    expect(output.extractedIssues.length).toBeGreaterThan(0);
    expect(output.prioritizedIssueList).toBeDefined();
    expect(output.prioritizedIssueList.some((issue) => issue.escalationReason === 'critical_executive_report')).toBe(
      true,
    );
    expect(output.executionTimestamp).toBeDefined();
  });
});