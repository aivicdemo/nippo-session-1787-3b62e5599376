import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery: sendUnsubmittedReminder', () => {
  // SCEN-114: [error] 日報収集から分析レポート生成までの自動実行 AIエージェント
  // - 重大インシデントまたはリスク案件が検出された場合に副作用の確定前に人へ引き継ぐ
  test('should escalate to human when critical incident or risk issue is detected before distribution', async () => {
    // Arrange: テスト用入力データを準備
    const submittedReports = [
      {
        reportId: 'rpt_001',
        submitterId: 'user_001',
        submitterName: 'Alice',
        submissionDate: '2024-01-08',
        content: 'システムダウンによる本番環境への影響が発生。全顧客に影響。復旧予定未定。',
        extractedIssues: [
          {
            issueId: 'issue_001',
            category: 'incident',
            description: 'システムダウン',
            severity: 'critical',
            affectedCount: 500,
          },
        ],
      },
      {
        reportId: 'rpt_002',
        submitterId: 'user_002',
        submitterName: 'Bob',
        submissionDate: '2024-01-08',
        content: 'API応答遅延により決済処理が遅延。顧客クレーム多数。',
        extractedIssues: [
          {
            issueId: 'issue_002',
            category: 'risk',
            description: 'API応答遅延',
            severity: 'high',
            affectedCount: 150,
          },
        ],
      },
      {
        reportId: 'rpt_003',
        submitterId: 'user_003',
        submitterName: 'Charlie',
        submissionDate: '2024-01-08',
        content: 'テスト環境でのバグ発見。修正予定。',
        extractedIssues: [
          {
            issueId: 'issue_003',
            category: 'quality',
            description: 'テストバグ',
            severity: 'low',
            affectedCount: 0,
          },
        ],
      },
    ];

    const unsubmittedMembers = [
      { userId: 'user_010', name: 'David' },
      { userId: 'user_011', name: 'Eve' },
    ];

    const priorityScoreResults = [
      {
        issueId: 'issue_001',
        priority: 'P0_critical',
        score: 95,
        riskLevel: 'critical_incident',
        requiresEscalation: true,
      },
      {
        issueId: 'issue_002',
        priority: 'P1_high',
        score: 80,
        riskLevel: 'risk_issue',
        requiresEscalation: true,
      },
      {
        issueId: 'issue_003',
        priority: 'P3_low',
        score: 20,
        riskLevel: 'standard',
        requiresEscalation: false,
      },
    ];

    const input = {
      week: '2024-01-01_to_2024-01-07',
      submittedReports,
      unsubmittedMembers,
      priorityScoreResults,
      currentAction: 5,
      escalationCheckEnabled: true,
    };

    // Act: sendUnsubmittedReminder を実行
    const result = await sendUnsubmittedReminder(input);

    // Assert 1: 重大インシデント/リスク案件が検出されたかを確認
    expect(result.escalationTriggered).toBe(true);
    expect(result.escalationReason).toMatch(/critical_incident|risk_issue/);

    // Assert 2: 引き継ぎコンテキストに必要な情報が含まれることを確認
    expect(result.escalationContext).toBeDefined();
    expect(result.escalationContext.detectedIssues).toBeDefined();
    expect(result.escalationContext.detectedIssues.length).toBeGreaterThan(0);

    // Assert 3: 検出された重大インシデント/リスク案件の詳細確認
    const criticalIssues = result.escalationContext.detectedIssues.filter(
      (issue: { riskLevel: string }) =>
        issue.riskLevel === 'critical_incident' || issue.riskLevel === 'risk_issue'
    );
    expect(criticalIssues.length).toBe(2); // issue_001 と issue_002

    // Assert 4: 関連する日報データが引き継ぎコンテキストに含まれることを確認
    expect(result.escalationContext.relatedReports).toBeDefined();
    expect(result.escalationContext.relatedReports.length).toBe(2);
    expect(result.escalationContext.relatedReports[0].submitterName).toBe('Alice');
    expect(result.escalationContext.relatedReports[1].submitterName).toBe('Bob');

    // Assert 5: 現在の処理状態が正しく記録されていることを確認
    expect(result.escalationContext.processingStatus).toBe('paused_at_action_06');
    expect(result.escalationContext.completedActions).toBe(5);
    expect(result.escalationContext.pausedAction).toBe(6);

    // Assert 6: 人による確認が必要な理由が明記されていることを確認
    expect(result.escalationContext.escalationMessage).toBeDefined();
    expect(result.escalationContext.escalationMessage).toMatch(/確認/);
    expect(result.escalationContext.escalationMessage).toMatch(/判断/);

    // Assert 7: Action 6（配信）がスキップされていることを確認
    expect(result.actionStatus.action_06).toBe('skipped');
    expect(result.actionStatus.action_07).toBe('not_executed');

    // Assert 8: 配信がスキップされ、待機状態に遷移していることを確認
    expect(result.status).toBe('awaiting_human_review');
    expect(result.distributionExecuted).toBe(false);

    // Assert 9: 監査ログにエスカレーション詳細が記録されていることを確認
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.length).toBeGreaterThan(0);

    const escalationLogEntry = result.auditLog.find(
      (entry: { eventType: string }) => entry.eventType === 'escalation_triggered'
    );
    expect(escalationLogEntry).toBeDefined();
    expect(escalationLogEntry.escalationTrigger).toBe('critical_incident_detected');
    expect(escalationLogEntry.pausedAtAction).toBe(6);
    expect(escalationLogEntry.timestamp).toBeDefined();
    expect(escalationLogEntry.triggeredByAction).toBe(5);

    // Assert 10: 外部システムへの呼び出しが一切発生していないことを確認
    expect(result.externalCalls).toBeDefined();
    expect(result.externalCalls.mailSent).toBe(false);
    expect(result.externalCalls.reportDistributed).toBe(false);
    expect(result.externalCalls.apiCallsExecuted).toBe(0);

    // Assert 11: 未提出者への通知が保留されていることを確認
    expect(result.unsubmittedNotificationStatus).toBe('pending');
    expect(result.unsubmittedMembersCount).toBe(2);
  });
});