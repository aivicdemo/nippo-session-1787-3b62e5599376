import { runTx4Imp1Agent, type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('Tx4Imp1Agent - ダッシュボード分析から課題指示までの自動実行', () => {
  test('SCEN-3137: 経営判断が必要な重大課題でエスカレーション引き継ぎが実行される', async () => {
    // テストデータ準備
    const executionId = 'exec-20240115-001';
    const teamId = 'team-dev-001';
    const managerId = 'mgr-001';
    const reportDate = '2024-01-15';
    const meetingStartTime = '09:00';

    // ダッシュボードデータ: 複数部門にまたがる進捗遅延課題、経営判断が必要な重大課題、通常優先度課題
    const dashboardData = {
      progressDelayIssue: {
        issueId: 'issue-001',
        title: '営業・開発部門にまたがるAPI仕様遅延',
        affectedTeams: ['team-dev-001', 'team-sales-001'],
        severity: 'medium',
        estimatedDays: 7,
      },
      criticalBusinessImpactIssue: {
        issueId: 'issue-002',
        title: '売上目標50%未達のリスク',
        businessImpactPercentage: 50,
        severity: 'critical',
        requiresExecutiveDecision: true,
        estimatedDays: 14,
      },
      normalIssue1: {
        issueId: 'issue-003',
        title: '小規模なバグ修正',
        severity: 'low',
        estimatedDays: 2,
      },
      normalIssue2: {
        issueId: 'issue-004',
        title: 'ドキュメント更新',
        severity: 'low',
        estimatedDays: 3,
      },
    };

    // アクション実行トレース用のレコード
    const executedActions: string[] = [];
    const notificationsSent: Array<{ type: string; recipient: string }> = [];
    const auditLogEntries: Array<{
      timestamp: string;
      executionId: string;
      escalationReason: string;
      transferredToUserId: string;
      transferredAtTimestamp: string;
    }> = [];

    // フェイクAiClient: Tx4Imp1AiClient構造に準拠
    const fakeAiClient: Tx4Imp1AiClient = {
      // Action 1: リアルタイム進捗データ自動集約
      aggregateRealtimeProgressData: async () => {
        executedActions.push('action-1-aggregateRealtimeProgressData');
        return {
          timestamp: '2024-01-15T08:50:00Z',
          teamData: [
            {
              teamId: teamId,
              submittedReports: 9,
              totalMembers: 10,
              unsubmittedMembers: ['eng-010'],
            },
          ],
          progressMetrics: dashboardData,
        };
      },

      // Action 2: 進捗遅延・未提出・異常値検出
      detectProgressAnomalies: async (aggregatedData: any) => {
        executedActions.push('action-2-detectProgressAnomalies');
        return {
          detectedIssues: [
            dashboardData.progressDelayIssue,
            dashboardData.criticalBusinessImpactIssue,
            dashboardData.normalIssue1,
            dashboardData.normalIssue2,
          ],
        };
      },

      // Action 3: 過去の類似課題照合と再発リスク評価
      evaluateReccurrenceRisk: async (detectedIssues: any) => {
        executedActions.push('action-3-evaluateReccurrenceRisk');
        return {
          enrichedIssues: detectedIssues.map((issue: any) => ({
            ...issue,
            reccurrenceRiskScore:
              issue.issueId === 'issue-001' ? 65 : issue.issueId === 'issue-002' ? 40 : 20,
          })),
        };
      },

      // Action 4: 課題を重要度と緊急度で自動優先順位付け
      prioritizeIssuesByUrgencyAndImportance: async (enrichedIssues: any) => {
        executedActions.push('action-4-prioritizeIssuesByUrgencyAndImportance');
        const prioritized = enrichedIssues.sort((a: any, b: any) => {
          const severityRank: Record<string, number> = { critical: 3, medium: 2, low: 1 };
          return (
            (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0) ||
            (b.reccurrenceRiskScore || 0) - (a.reccurrenceRiskScore || 0)
          );
        });
        return { prioritizedIssues: prioritized };
      },

      // Action 5: 各課題に対する推奨対応方針生成
      generateRecommendedCountermeasures: async (prioritizedIssues: any) => {
        executedActions.push('action-5-generateRecommendedCountermeasures');
        return {
          countermeasurePlans: prioritizedIssues.map((issue: any) => ({
            topPriorityIssue: issue.title,
            recommendedActions:
              issue.issueId === 'issue-002'
                ? [
                    '経営層と売上シナリオの再検討',
                    '顧客対応部門との調整',
                    '予算配分の見直し',
                  ]
                : [
                    `${issue.title}の対応チーム割り当て`,
                    `完了期限: ${issue.estimatedDays}営業日`,
                  ],
            estimatedResolutionDays: issue.estimatedDays,
            assignedTeamId: teamId,
            requiresExecutiveDecision: issue.requiresExecutiveDecision || false,
          })),
        };
      },

      // Action 6: 朝会報告用ダッシュボード資料自動作成
      createMorningMeetingDashboard: async (countermeasurePlans: any) => {
        executedActions.push('action-6-createMorningMeetingDashboard');
        const criticalPlan = countermeasurePlans.find(
          (plan: any) => plan.requiresExecutiveDecision
        );
        const escalationStatus = criticalPlan ? 'awaiting_executive_decision' : 'ready_to_present';
        return {
          dashboardId: `dashboard-${executionId}`,
          reportDate: reportDate,
          meetingStartTime: meetingStartTime,
          prioritizedIssues: countermeasurePlans,
          escalationFlag: !!criticalPlan,
          escalationReason: criticalPlan
            ? '経営判断が必要な重大課題'
            : null,
          status: escalationStatus,
          unsubmittedMembers: ['eng-010'],
          completionTimestamp: new Date('2024-01-15T08:55:00Z').toISOString(),
        };
      },

      // Action 7: 未提出メンバーへの通知送信
      sendUnsubmittedMemberNotifications: async (unsubmittedMembers: string[]) => {
        executedActions.push('action-7-sendUnsubmittedMemberNotifications');
        for (const memberId of unsubmittedMembers) {
          notificationsSent.push({
            type: 'unsubmitted_reminder',
            recipient: memberId,
          });
        }
        return { notificationsSent: notificationsSent.length };
      },

      // Escalation handler: 経営判断が必要な場合の引き継ぎロジック
      handleExecutiveEscalation: async (
        escalationReason: string,
        dashboard: any
      ) => {
        const transferredAtTimestamp = new Date('2024-01-15T08:56:00Z').toISOString();
        auditLogEntries.push({
          timestamp: new Date('2024-01-15T08:56:00Z').toISOString(),
          executionId: executionId,
          escalationReason: escalationReason,
          transferredToUserId: managerId,
          transferredAtTimestamp: transferredAtTimestamp,
        });
        return {
          escalationHandled: true,
          transferredToUserId: managerId,
          dashboardStatus: 'awaiting_executive_decision',
          transferredAtTimestamp: transferredAtTimestamp,
        };
      },
    };

    // runTx4Imp1Agentを呼び出し
    const result = await runTx4Imp1Agent(
      {
        teamId: teamId,
        managerId: managerId,
        reportDate: reportDate,
        meetingStartTime: meetingStartTime,
      },
      fakeAiClient
    );

    // 検証: Action 1-5が実行されたことを確認
    expect(executedActions).toContain('action-1-aggregateRealtimeProgressData');
    expect(executedActions).toContain('action-2-detectProgressAnomalies');
    expect(executedActions).toContain('action-3-evaluateReccurrenceRisk');
    expect(executedActions).toContain('action-4-prioritizeIssuesByUrgencyAndImportance');
    expect(executedActions).toContain('action-5-generateRecommendedCountermeasures');

    // 検証: Action 6が実行されたことを確認
    expect(executedActions).toContain('action-6-createMorningMeetingDashboard');

    // 検証: ダッシュボード資料が『経営判断待ち』ステータスで返却されたことを確認
    expect(result.status).toBe('awaiting_executive_decision');
    expect(result.escalationFlag).toBe(true);
    expect(result.escalationReason).toBe('経営判断が必要な重大課題');

    // 検証: 推奨対応方針が同梱されていることを確認
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBeGreaterThan(0);
    const criticalIssuePlan = result.prioritizedIssues.find(
      (plan: any) => plan.requiresExecutiveDecision
    );
    expect(criticalIssuePlan).toBeDefined();
    expect(criticalIssuePlan.topPriorityIssue).toBe('売上目標50%未達のリスク');
    expect(criticalIssuePlan.recommendedActions).toEqual(
      expect.arrayContaining([
        expect.stringContaining('経営層'),
        expect.stringContaining('顧客対応'),
        expect.stringContaining('予算'),
      ])
    );

    // 検証: Action 7（未提出メンバー通知）が実行されないことを確認
    expect(executedActions).not.toContain(
      'action-7-sendUnsubmittedMemberNotifications'
    );
    expect(notificationsSent).toHaveLength(0);

    // 検証: エスカレーション引き継ぎロジックが実行されたことを確認
    expect(result.escalationHandled).toBe(true);
    expect(result.transferredToUserId).toBe(managerId);
    expect(result.transferredAtTimestamp).toBe('2024-01-15T08:56:00Z');

    // 検証: 監査ログにエスカレーション理由と引き継ぎ実行時刻が記録されていることを確認
    expect(auditLogEntries).toHaveLength(1);
    const auditEntry = auditLogEntries[0];
    expect(auditEntry.executionId).toBe(executionId);
    expect(auditEntry.escalationReason).toBe('経営判断が必要な重大課題');
    expect(auditEntry.transferredToUserId).toBe(managerId);
    expect(auditEntry.transferredAtTimestamp).toBe('2024-01-15T08:56:00Z');
  });
});