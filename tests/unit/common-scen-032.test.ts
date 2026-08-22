import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';
import type { UnsubmittedReminderRequest, UnsubmittedReminderResponse } from '../../src/logic/notification-delivery';

describe('notification-delivery: sendUnsubmittedReminder', () => {
  // SCEN-032: [error] 日報集約から課題優先順位付けと未提出通知までの自律実行 AIエージェント - 「日報集約から課題優先順位付けと未提出通知までの自律実行」が「優先度判定ルールに該当しない新規課題タイプ」の場合に副作用の確定前に人へ引き継ぐ
  test('should escalate to manager when unclassified issue type is detected and halt side effects', async () => {
    const request: UnsubmittedReminderRequest = {
      agentExecutionId: 'agent_exec_20240115_001',
      reportingCycleDate: new Date('2024-01-15T09:00:00Z'),
      unsubmittedMemberIds: ['member_001', 'member_002'],
      extractedIssues: [
        {
          issueId: 'issue_20240115_001',
          title: 'データベース接続タイムアウト',
          description: '本番環境でのDB接続が間欠的に失敗している状態',
          detectedCategoryType: 'infrastructure_networking',
          severity: 'high',
          urgency: 'critical',
          knownRuleMatches: [],
          isNewUnknownType: true,
          timestamp: new Date('2024-01-15T08:45:00Z'),
        },
      ],
      priorityRules: [
        {
          ruleId: 'rule_priority_high_critical',
          severityRange: ['high', 'critical'],
          urgencyRange: ['critical', 'emergency'],
          assignedPriority: 1,
          description: 'High severity + Critical/Emergency urgency = Priority 1',
        },
        {
          ruleId: 'rule_priority_medium_high',
          severityRange: ['medium'],
          urgencyRange: ['high'],
          assignedPriority: 2,
          description: 'Medium severity + High urgency = Priority 2',
        },
      ],
      escalationCallbacks: {
        onUnclassifiedType: async (issue, rules) => ({
          escalationNotificationId: 'esc_notif_20240115_001',
          targetManagerId: 'manager_001',
          issueContent: issue.title,
          unclassifiedCategory: issue.detectedCategoryType,
          ruleGap: `Detected category "${issue.detectedCategoryType}" not covered by existing ${rules.length} rules`,
          requiresManualReview: true,
          timestamp: new Date('2024-01-15T08:50:00Z'),
          issueId: issue.issueId,
        }),
        onMorningMaterialGeneration: async () => {
          throw new Error('Should not be called when escalation is triggered');
        },
        onCompletionNotification: async () => {
          throw new Error('Should not be called when escalation is triggered');
        },
      },
      auditLogger: {
        logEscalation: async (event) => {
          return {
            auditId: 'audit_20240115_001',
            eventType: event.eventType,
            escalationReason: event.escalationReason,
            targetIssueId: event.targetIssueId,
            detectedIssueType: event.detectedIssueType,
            timestamp: new Date('2024-01-15T08:52:00Z'),
            status: 'recorded',
          };
        },
      },
    };

    const response: UnsubmittedReminderResponse = await sendUnsubmittedReminder(request);

    expect(response.success).toBe(false);
    expect(response.escalationTriggered).toBe(true);
    expect(response.escalationReason).toBe('unclassified_issue_type');
    expect(response.haltedAt).toBe('action_4_priority_judgment');
    expect(response.escalationNotification).toBeDefined();
    expect(response.escalationNotification?.targetManagerId).toBe('manager_001');
    expect(response.escalationNotification?.issueContent).toBe('データベース接続タイムアウト');
    expect(response.escalationNotification?.unclassifiedCategory).toBe('infrastructure_networking');
    expect(response.escalationNotification?.requiresManualReview).toBe(true);
    expect(response.escalationNotification?.issueId).toBe('issue_20240115_001');

    expect(response.auditLog).toBeDefined();
    expect(response.auditLog?.eventType).toBe('escalation');
    expect(response.auditLog?.escalationReason).toBe('unclassified_issue_type_detected');
    expect(response.auditLog?.detectedIssueType).toBe('infrastructure_networking');
    expect(response.auditLog?.status).toBe('pending_manager_review');

    expect(response.actionExecutionTrace).toContain('action_1_fetch_submission_status');
    expect(response.actionExecutionTrace).toContain('action_2_detect_unsubmitted');
    expect(response.actionExecutionTrace).toContain('action_3_extract_issues');
    expect(response.actionExecutionTrace).toContain('action_4_priority_judgment');
    expect(response.actionExecutionTrace).not.toContain('action_5_generate_morning_material');
    expect(response.actionExecutionTrace).not.toContain('action_6_completion_notification');

    expect(response.sideEffectsCommitted).toBe(false);
    expect(response.pendingState).toMatchObject({
      isHalted: true,
      haltReason: 'escalation_condition_triggered_before_side_effect_commit',
      awaitingApprovalFrom: 'manager_001',
      escalationId: 'esc_notif_20240115_001',
      resumeCheckInterval: 60000,
    });
  });
});