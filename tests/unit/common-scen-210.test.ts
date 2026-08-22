import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import type { Tx11AgentInput, Tx11AgentOutput, SubmissionStatusSummary, PrioritizedIssue, NotificationRecord } from '../../src/agents/tx-11-imp-1/orchestrator';

interface AuditRecord {
  agent_id: string;
  timestamp: Date;
  event_type: string;
  action_id?: string;
  status: string;
  details?: Record<string, unknown>;
}

describe('tx-11-imp-1 orchestrator audit trail', () => {
  let auditRecords: AuditRecord[];

  beforeEach(() => {
    auditRecords = [];
  });

  // SCEN-210: [normal] 日報収集・確認・催促の自動化エージェント - 監査記録の完全な時系列トレース
  test('should record audit trail from start through all actions to completion with proper timestamps and identifiers', async () => {
    // Arrange: モック AI クライアントの準備
    const mockAiClient = {
      action01_getSubmissionStatus: jest.fn().mockResolvedValue({
        totalMembers: 10,
        submittedCount: 7,
        unsubmittedMembers: ['member-001', 'member-002', 'member-003'],
      } as SubmissionStatusSummary),

      action02_sendNotifications: jest.fn().mockResolvedValue([
        {
          memberId: 'member-001',
          notificationId: 'notif-001',
          sentAt: new Date('2024-01-15T08:05:00Z'),
          status: 'sent',
        },
        {
          memberId: 'member-002',
          notificationId: 'notif-002',
          sentAt: new Date('2024-01-15T08:05:01Z'),
          status: 'sent',
        },
        {
          memberId: 'member-003',
          notificationId: 'notif-003',
          sentAt: new Date('2024-01-15T08:05:02Z'),
          status: 'sent',
        },
      ] as NotificationRecord[]),

      action03_extractIssues: jest.fn().mockResolvedValue([
        { id: 'issue-001', title: 'Database performance', category: 'performance' },
        { id: 'issue-002', title: 'API timeout', category: 'infrastructure' },
      ]),

      action04_searchReferenceInfo: jest.fn().mockResolvedValue([
        { issueId: 'issue-001', relatedPastIssues: ['past-issue-101'] },
        { issueId: 'issue-002', relatedPastIssues: ['past-issue-102', 'past-issue-103'] },
      ]),

      action05_prioritizeAndSummarize: jest.fn().mockResolvedValue({
        issues: [
          {
            id: 'issue-001',
            title: 'Database performance',
            priority: 1,
            score: 8.5,
          },
          {
            id: 'issue-002',
            title: 'API timeout',
            priority: 2,
            score: 7.2,
          },
        ],
      } as { issues: PrioritizedIssue[] }),

      action06_sendSummaryToManager: jest.fn().mockResolvedValue({
        managerId: 'manager-001',
        emailSentAt: new Date('2024-01-15T08:10:00Z'),
        status: 'sent',
      }),

      action07_presentReferenceToMembers: jest.fn().mockResolvedValue({
        presentedToCount: 7,
        presentedAt: new Date('2024-01-15T08:11:00Z'),
        status: 'completed',
      }),
    };

    // モック監査記録ストレージ
    const mockAuditStore = {
      recordEvent: (record: AuditRecord) => {
        auditRecords.push(record);
      },
    };

    // エージェント入力の準備
    const agentInput: Tx11AgentInput = {
      executionTimestamp: new Date('2024-01-15T08:00:00Z'),
      teamId: 'team-001',
      reportDeadlineTime: '08:30',
      managerEmail: 'manager@example.com',
    };

    // Act: オーケストレーター実行（監査記録店舗を注入）
    const result = await runTx11Imp1Agent(agentInput, mockAiClient, mockAuditStore.recordEvent);

    // Assert: 監査記録が正しく記録されていることを検証

    // 1. STARTED イベントが記録されていることを確認
    const startedEvent = auditRecords.find((r) => r.event_type === 'STARTED');
    expect(startedEvent).toBeDefined();
    expect(startedEvent?.agent_id).toBe('tx-11-imp-1');
    expect(startedEvent?.timestamp).toEqual(new Date('2024-01-15T08:00:00Z'));
    expect(startedEvent?.status).toBe('INITIATED');

    // 2. Action 1 (日報提出状況確認) の完了イベントを確認
    const action01Event = auditRecords.find(
      (r) => r.event_type === 'action_completed' && r.action_id === 'action-01'
    );
    expect(action01Event).toBeDefined();
    expect(action01Event?.agent_id).toBe('tx-11-imp-1');
    expect(action01Event?.status).toBe('SUCCESS');
    expect(action01Event?.timestamp).toBeDefined();

    // 3. Action 2 (未提出者への催促通知) の完了イベントを確認
    const action02Event = auditRecords.find(
      (r) => r.event_type === 'action_completed' && r.action_id === 'action-02'
    );
    expect(action02Event).toBeDefined();
    expect(action02Event?.agent_id).toBe('tx-11-imp-1');
    expect(action02Event?.status).toBe('SUCCESS');
    expect(action02Event?.timestamp).toBeDefined();

    // 4. Action 3 (課題の自動抽出) の完了イベントを確認
    const action03Event = auditRecords.find(
      (r) => r.event_type === 'action_completed' && r.action_id === 'action-03'
    );
    expect(action03Event).toBeDefined();
    expect(action03Event?.agent_id).toBe('tx-11-imp-1');
    expect(action03Event?.status).toBe('SUCCESS');
    expect(action03Event?.timestamp).toBeDefined();

    // 5. Action 4 (参考情報の検索・提示) の完了イベントを確認
    const action04Event = auditRecords.find(
      (r) => r.event_type === 'action_completed' && r.action_id === 'action-04'
    );
    expect(action04Event).toBeDefined();
    expect(action04Event?.agent_id).toBe('tx-11-imp-1');
    expect(action04Event?.status).toBe('SUCCESS');
    expect(action04Event?.timestamp).toBeDefined();

    // 6. Action 5 (課題の優先度付け・サマリー作成) の完了イベントを確認
    const action05Event = auditRecords.find(
      (r) => r.event_type === 'action_completed' && r.action_id === 'action-05'
    );
    expect(action05Event).toBeDefined();
    expect(action05Event?.agent_id).toBe('tx-11-imp-1');
    expect(action05Event?.status).toBe('SUCCESS');
    expect(action05Event?.timestamp).toBeDefined();

    // 7. Action 6 (部長への朝会用サマリー配信) の完了イベントを確認
    const action06Event = auditRecords.find(
      (r) => r.event_type === 'action_completed' && r.action_id === 'action-06'
    );
    expect(action06Event).toBeDefined();
    expect(action06Event?.agent_id).toBe('tx-11-imp-1');
    expect(action06Event?.status).toBe('SUCCESS');
    expect(action06Event?.timestamp).toBeDefined();

    // 8. Action 7 (メンバーへの参考情報提示) の完了イベントを確認
    const action07Event = auditRecords.find(
      (r) => r.event_type === 'action_completed' && r.action_id === 'action-07'
    );
    expect(action07Event).toBeDefined();
    expect(action07Event?.agent_id).toBe('tx-11-imp-1');
    expect(action07Event?.status).toBe('SUCCESS');
    expect(action07Event?.timestamp).toBeDefined();

    // 9. completion イベント（成功）が記録されていることを確認
    const completionEvent = auditRecords.find((r) => r.event_type === 'completion');
    expect(completionEvent).toBeDefined();
    expect(completionEvent?.agent_id).toBe('tx-11-imp-1');
    expect(completionEvent?.status).toBe('SUCCESS');
    expect(completionEvent?.timestamp).toBeDefined();

    // 10. 監査記録の時系列順序を検証
    const eventSequence = auditRecords.map((r) => r.event_type);
    expect(eventSequence[0]).toBe('STARTED');
    expect(eventSequence.slice(1, 8)).toEqual([
      'action_completed',
      'action_completed',
      'action_completed',
      'action_completed',
      'action_completed',
      'action_completed',
      'action_completed',
    ]);
    expect(eventSequence[8]).toBe('completion');

    // 11. タイムスタンプの昇順を検証
    for (let i = 1; i < auditRecords.length; i++) {
      expect(auditRecords[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        auditRecords[i - 1].timestamp.getTime()
      );
    }

    // 12. 各監査レコードの必須フィールドを検証
    auditRecords.forEach((record) => {
      expect(record.agent_id).toBe('tx-11-imp-1');
      expect(record.timestamp).toBeDefined();
      expect(record.event_type).toBeDefined();
      expect(record.status).toBeDefined();
      expect(['INITIATED', 'SUCCESS', 'FAILURE']).toContain(record.status);

      // action_completed イベントの場合、action_id を検証
      if (record.event_type === 'action_completed') {
        expect(record.action_id).toBeDefined();
        expect(['action-01', 'action-02', 'action-03', 'action-04', 'action-05', 'action-06', 'action-07']).toContain(
          record.action_id
        );
      }
    });

    // 13. 監査記録の総数が正確であることを確認（STARTED + 7 actions + completion = 9）
    expect(auditRecords.length).toBe(9);

    // 14. エージェント出力が正しいことを検証
    expect(result).toBeDefined();
    expect(result.submissionStatus).toBeDefined();
    expect(result.submissionStatus.totalMembers).toBe(10);
    expect(result.submissionStatus.submittedCount).toBe(7);
    expect(result.submissionStatus.unsubmittedMembers).toEqual(['member-001', 'member-002', 'member-003']);
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBe(2);
    expect(result.notificationsSent).toBeDefined();
    expect(result.notificationsSent.length).toBe(3);
    expect(result.summaryEmailSent).toBe(true);
  });
});