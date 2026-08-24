import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AgentInput, Tx2Imp1AgentOutput } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行 - 優先度判定が不確実な場合のエスカレーション', () => {
  // SCEN-3104
  test('should escalate to human review when priority judgment confidence is below threshold and skip automated email delivery', async () => {
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:30:00Z');
    const targetTeamIds = ['team-001'];
    const managerUserIds = ['manager-001'];

    const mockAiClient: Tx2Imp1AiClient = {
      // Action 1: 全メンバーの日報受信状況を確認
      action01_confirmReportReception: async () => {
        return {
          receivedReportCount: 10,
          totalTeamMembers: 10,
          reportIds: [
            'report-001', 'report-002', 'report-003', 'report-004', 'report-005',
            'report-006', 'report-007', 'report-008', 'report-009', 'report-010'
          ],
          receivedAt: new Date('2024-01-15T08:55:00Z')
        };
      },

      // Action 2: 受信した日報を統一フォーマットに自動変換
      action02_convertToUnifiedFormat: async (reportIds: string[]) => {
        return {
          convertedCount: 10,
          conversionErrors: [],
          unifiedReports: reportIds.map((id, idx) => ({
            reportId: id,
            memberId: `member-${String(idx + 1).padStart(3, '0')}`,
            yesterday: `Completed task ${idx + 1}`,
            today: `Starting task ${idx + 1}`,
            challenges: idx === 4 
              ? 'Database connection timeout issues and slow query performance'
              : idx === 7
              ? 'Database connection timeout issues with retry logic'
              : `Challenge ${idx + 1}`,
            format: 'unified'
          }))
        };
      },

      // Action 3: テキスト解析で課題・リスク・成果を自動抽出
      action03_extractIssuesKeywords: async (unifiedReports: any[]) => {
        return {
          extractedIssueCount: 3,
          issues: [
            {
              issueId: 'issue-001',
              keywordText: 'Database connection timeout issues',
              occurrenceCount: 2,
              affectedMembers: ['member-005', 'member-008'],
              extractedContext: 'Database connectivity problem detected in multiple daily reports'
            },
            {
              issueId: 'issue-002',
              keywordText: 'slow query performance',
              occurrenceCount: 1,
              affectedMembers: ['member-005'],
              extractedContext: 'Query optimization needed for performance improvement'
            },
            {
              issueId: 'issue-003',
              keywordText: 'retry logic',
              occurrenceCount: 1,
              affectedMembers: ['member-008'],
              extractedContext: 'Improved error handling with retry mechanism implementation'
            }
          ]
        };
      },

      // Action 4: 抽出内容を優先度別に色分けして整理
      action04_prioritizeAndColorize: async (extractedIssues: any[]) => {
        return {
          prioritizedIssuesCount: 3,
          prioritizedIssues: [
            {
              issueId: 'issue-001',
              keywordText: 'Database connection timeout issues',
              priorityRank: 'HIGH',
              colorCode: '#FF0000',
              impactScore: 85,
              confidenceScore: 92,
              reasoning: 'Affects multiple team members and critical system function'
            },
            {
              issueId: 'issue-002',
              keywordText: 'slow query performance',
              priorityRank: 'MEDIUM',
              colorCode: '#FFFF00',
              impactScore: 65,
              confidenceScore: 48,
              reasoning: 'Performance degradation detected but single occurrence uncertain classification'
            },
            {
              issueId: 'issue-003',
              keywordText: 'retry logic',
              priorityRank: 'LOW',
              colorCode: '#00FF00',
              impactScore: 30,
              confidenceScore: 88,
              reasoning: 'Enhancement rather than critical issue'
            }
          ]
        };
      },

      // Action 5: 未提出メンバーを特定
      action05_identifyUnsubmittedMembers: async (teamIds: string[]) => {
        return {
          unsubmittedMembersCount: 0,
          unsubmittedMembers: [],
          totalTeamSize: 10
        };
      },

      // Action 6: スキップされるべき自動メール配信
      action06_generateAndSendConfirmationEmail: async (prioritizedIssues: any[], unsubmittedMembers: any[]) => {
        throw new Error('This action should not be called during escalation');
      }
    };

    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => {
        return { deliveryStatus: 'sent', userId, timestamp: new Date('2024-01-15T09:01:00Z') };
      })
    };

    const result = await runTx2Imp1Agent(
      {
        executionTimestamp,
        reportDeadlineTime,
        targetTeamIds,
        managerUserIds
      },
      mockAiClient,
      notificationServiceAdapter
    );

    // エスカレーション検出の確認
    expect(result.escalated).toBe(true);
    expect(result.requiresHumanReview).toBe(true);
    expect(result.taskId).toBeDefined();
    expect(typeof result.taskId).toBe('string');
    expect(result.taskId.length).toBeGreaterThan(0);

    // 保留中アクション説明の確認
    expect(result.pendingActionDescription).toBeDefined();
    expect(typeof result.pendingActionDescription).toBe('string');
    expect(result.pendingActionDescription).toMatch(/優先度判定/);
    expect(result.pendingActionDescription).toMatch(/確定前/);

    // 部長への通知が1回だけ呼び出されたことを確認
    expect(notificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);

    // 通知の内容を確認
    const notificationCall = notificationServiceAdapter.sendReminderNotification.mock.calls[0];
    expect(notificationCall[0]).toBe('manager-001');
    expect(notificationCall[1]).toMatch(/優先度判定が確定前に人へ引き継ぎました/);

    // 自動メール配信が実行されなかったことを確認
    // (action06_generateAndSendConfirmationEmail が呼び出されないこと)
    // これはモック内で throw するため、if action06 が呼び出されると失敗する

    // エスカレーション対象の課題情報が結果に含まれているか確認
    expect(result).toHaveProperty('escalationDetails');
    if (result.escalationDetails) {
      expect(result.escalationDetails.escalationReason).toBe('uncertain_priority_judgment');
      expect(result.escalationDetails.affectedIssueId).toBe('issue-002');
      expect(result.escalationDetails.issueText).toBe('slow query performance');
      expect(result.escalationDetails.confidenceScore).toBe(48);
      expect(result.escalationDetails.confidenceScore).toBeLessThanOrEqual(50);
      expect(Array.isArray(result.escalationDetails.candidatePriorities)).toBe(true);
      expect(result.escalationDetails.candidatePriorities.length).toBeGreaterThan(0);
      expect(result.escalationDetails.extractedContext).toBeDefined();
      expect(typeof result.escalationDetails.timestamp).toBe('string');
      expect(result.escalationDetails.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.escalationDetails.agentSessionId).toBeDefined();
    }

    // 結果の確認メール配信フラグが false であることを確認
    expect(result.confirmationEmailSent).toBe(false);

    // 集約された報告件数は計算されていることを確認（エスカレーション前の処理は完了）
    expect(result.aggregatedReportCount).toBe(10);

    // 抽出された課題キーワードの件数は3件
    expect(result.extractedIssueCount).toBe(3);

    // 優先度付け課題一覧は含まれるが、未検証状態
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);
    expect(result.prioritizedIssues.length).toBe(3);

    // 高確度の課題のみ prioritizedIssues に含まれる可能性がある
    // または全課題が含まれるが escalated フラグで判定を保留する
    const uncertainIssue = result.prioritizedIssues.find((i: any) => i.issueId === 'issue-002');
    if (uncertainIssue) {
      expect(uncertainIssue.confidenceScore).toBe(48);
    }
  });
});