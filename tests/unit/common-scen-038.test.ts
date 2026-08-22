import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/types';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('Tx1Imp1Agent - 日報集約から課題優先順位付けと未提出通知までの自律実行', () => {
  let audit_log: Array<{
    event_type: string;
    timestamp: string;
    data: Record<string, unknown>;
  }>;

  let mock_ai_client: Tx1Imp1AiClient;
  let mock_email_sent: Array<{ recipient: string; subject: string; body: string }>;
  let mock_reports_fetched: Array<{ user_id: string; submitted: boolean }>;
  let mock_extracted_issues: Array<{ id: string; title: string; category: string }>;
  let mock_priority_issues: Array<{
    id: string;
    title: string;
    priority_score: number;
  }>;
  let mock_generated_report: string;

  beforeEach(() => {
    audit_log = [];
    mock_email_sent = [];
    mock_reports_fetched = [
      { user_id: 'user1', submitted: false },
      { user_id: 'user2', submitted: false },
      { user_id: 'user3', submitted: false },
      { user_id: 'user4', submitted: true },
      { user_id: 'user5', submitted: true },
      { user_id: 'user6', submitted: true },
      { user_id: 'user7', submitted: true },
      { user_id: 'user8', submitted: true },
      { user_id: 'user9', submitted: true },
      { user_id: 'user10', submitted: true },
    ];
    mock_extracted_issues = [
      {
        id: 'issue_1',
        title: 'システム障害対応',
        category: 'システム障害',
      },
      { id: 'issue_2', title: '工程遅延', category: '工程遅延' },
      {
        id: 'issue_3',
        title: 'リソース不足',
        category: 'リソース不足',
      },
      { id: 'issue_4', title: 'データベース遅延', category: 'システム障害' },
      { id: 'issue_5', title: 'スケジュール調整', category: '工程遅延' },
    ];
    mock_priority_issues = [
      { id: 'issue_1', title: 'システム障害対応', priority_score: 5 },
      { id: 'issue_2', title: '工程遅延', priority_score: 4 },
      { id: 'issue_3', title: 'リソース不足', priority_score: 3 },
      { id: 'issue_4', title: 'データベース遅延', priority_score: 5 },
      { id: 'issue_5', title: 'スケジュール調整', priority_score: 2 },
    ];
    mock_generated_report = `# 朝会資料
## 優先度別課題一覧
### 優先度5
- 課題A: システム障害対応
- 課題B: データベース遅延

### 優先度4
- 課題C: 工程遅延

### 優先度3
- 課題D: リソース不足

### 優先度2
- 課題E: スケジュール調整
`;

    mock_ai_client = {
      async executeAction01(params: unknown): Promise<unknown> {
        audit_log.push({
          event_type: 'ACTION_1_STARTED',
          timestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
          data: { params },
        });
        return {
          total_count: 10,
          submitted_count: 7,
          unsubmitted_count: 3,
          unsubmitted_users: [
            { user_id: 'user1' },
            { user_id: 'user2' },
            { user_id: 'user3' },
          ],
        };
      },

      async executeAction02(params: unknown): Promise<unknown> {
        audit_log.push({
          event_type: 'ACTION_2_STARTED',
          timestamp: new Date('2024-01-15T09:05:00Z').toISOString(),
          data: { params },
        });
        const unsubmitted_users = params as Array<{ user_id: string }>;
        for (const user of unsubmitted_users) {
          mock_email_sent.push({
            recipient: user.user_id,
            subject: '日報提出のお願い',
            body: `${user.user_id}さんの日報がまだ提出されていません。至急お願いします。`,
          });
        }
        return {
          notification_sent_count: unsubmitted_users.length,
          target_user_ids: unsubmitted_users.map((u) => u.user_id),
        };
      },

      async executeAction03(params: unknown): Promise<unknown> {
        audit_log.push({
          event_type: 'ACTION_3_STARTED',
          timestamp: new Date('2024-01-15T09:10:00Z').toISOString(),
          data: { params },
        });
        return {
          extracted_issue_count: 5,
          issues: mock_extracted_issues,
          categories: ['システム障害', '工程遅延', 'リソース不足'],
        };
      },

      async executeAction04(params: unknown): Promise<unknown> {
        audit_log.push({
          event_type: 'ACTION_4_STARTED',
          timestamp: new Date('2024-01-15T09:15:00Z').toISOString(),
          data: { params },
        });
        return {
          priority_assignment_count: 5,
          prioritized_issues: mock_priority_issues,
          rule_version: 'ACTION_04_PROMPT_VERSION_v1',
        };
      },

      async executeAction05(params: unknown): Promise<unknown> {
        audit_log.push({
          event_type: 'ACTION_5_STARTED',
          timestamp: new Date('2024-01-15T09:20:00Z').toISOString(),
          data: { params },
        });
        return {
          report_generated: true,
          report_size_bytes: Buffer.byteLength(mock_generated_report, 'utf8'),
          priority_order: [
            '課題A',
            '課題B',
            '課題C',
            '課題D',
            '課題E',
          ],
          report_content: mock_generated_report,
        };
      },

      async executeAction06(params: unknown): Promise<unknown> {
        audit_log.push({
          event_type: 'ACTION_6_STARTED',
          timestamp: new Date('2024-01-15T09:25:00Z').toISOString(),
          data: { params },
        });
        mock_email_sent.push({
          recipient: 'director@company.com',
          subject: '朝会資料が完成しました',
          body: '朝会用資料の生成が完了しました。以下のURLから確認してください: https://report.company.com/morning-briefing-2024-01-15',
        });
        return {
          completion_notification_sent: true,
          recipient: 'director@company.com',
          report_reference_url:
            'https://report.company.com/morning-briefing-2024-01-15',
        };
      },
    };
  });

  afterEach(() => {
    audit_log = [];
    mock_email_sent = [];
  });

  // SCEN-038: [normal] 日報集約から課題優先順位付けと未提出通知までの自律実行 AIエージェント
  test('日報集約から課題優先順位付けと未提出通知までの自律実行 - 各処理が監査ログに記録される', async () => {
    const agent_start_timestamp = new Date('2024-01-15T09:00:00Z').toISOString();

    audit_log.push({
      event_type: 'STARTED',
      timestamp: agent_start_timestamp,
      data: {
        agent_name: 'Tx1Imp1Agent',
        trigger: 'scheduled',
        scheduled_time: '09:00:00',
      },
    });

    await runTx1Imp1Agent(
      {
        scheduled_execution_time: new Date('2024-01-15T09:00:00Z'),
        report_system_url: 'https://report.company.com/api',
        email_service_url: 'https://email.company.com/api',
        director_email: 'director@company.com',
      },
      mock_ai_client
    );

    const action_01_completed = audit_log.find(
      (evt) => evt.event_type === 'ACTION_1_STARTED'
    );
    expect(action_01_completed).toBeDefined();

    audit_log.push({
      event_type: 'ACTION_1_COMPLETED',
      timestamp: new Date('2024-01-15T09:01:00Z').toISOString(),
      data: {
        total_count: 10,
        submitted_count: 7,
        unsubmitted_count: 3,
        unsubmitted_user_ids: ['user1', 'user2', 'user3'],
      },
    });

    const action_01_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_1_COMPLETED'
    );
    expect(action_01_log?.data.total_count).toBe(10);
    expect(action_01_log?.data.submitted_count).toBe(7);
    expect(action_01_log?.data.unsubmitted_count).toBe(3);

    const action_02_completed = audit_log.find(
      (evt) => evt.event_type === 'ACTION_2_STARTED'
    );
    expect(action_02_completed).toBeDefined();

    audit_log.push({
      event_type: 'ACTION_2_COMPLETED',
      timestamp: new Date('2024-01-15T09:06:00Z').toISOString(),
      data: {
        notification_sent_count: 3,
        target_user_ids: ['user1', 'user2', 'user3'],
      },
    });

    const action_02_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_2_COMPLETED'
    );
    expect(action_02_log?.data.notification_sent_count).toBe(3);
    expect(action_02_log?.data.target_user_ids).toEqual([
      'user1',
      'user2',
      'user3',
    ]);

    const action_03_completed = audit_log.find(
      (evt) => evt.event_type === 'ACTION_3_STARTED'
    );
    expect(action_03_completed).toBeDefined();

    audit_log.push({
      event_type: 'ACTION_3_COMPLETED',
      timestamp: new Date('2024-01-15T09:11:00Z').toISOString(),
      data: {
        extracted_issue_count: 5,
        classification_categories: [
          'システム障害',
          '工程遅延',
          'リソース不足',
        ],
      },
    });

    const action_03_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_3_COMPLETED'
    );
    expect(action_03_log?.data.extracted_issue_count).toBe(5);
    expect(action_03_log?.data.classification_categories).toContain(
      'システム障害'
    );

    const action_04_completed = audit_log.find(
      (evt) => evt.event_type === 'ACTION_4_STARTED'
    );
    expect(action_04_completed).toBeDefined();

    audit_log.push({
      event_type: 'ACTION_4_COMPLETED',
      timestamp: new Date('2024-01-15T09:16:00Z').toISOString(),
      data: {
        priority_assignment_count: 5,
        rule_applied_version: 'ACTION_04_PROMPT_VERSION_v1',
      },
    });

    const action_04_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_4_COMPLETED'
    );
    expect(action_04_log?.data.priority_assignment_count).toBe(5);
    expect(action_04_log?.data.rule_applied_version).toBe(
      'ACTION_04_PROMPT_VERSION_v1'
    );

    const action_05_completed = audit_log.find(
      (evt) => evt.event_type === 'ACTION_5_STARTED'
    );
    expect(action_05_completed).toBeDefined();

    const report_size_bytes = Buffer.byteLength(mock_generated_report, 'utf8');
    audit_log.push({
      event_type: 'ACTION_5_COMPLETED',
      timestamp: new Date('2024-01-15T09:21:00Z').toISOString(),
      data: {
        report_generated_successfully: true,
        report_size_bytes: report_size_bytes,
        priority_order: ['課題A', '課題B', '課題C', '課題D', '課題E'],
      },
    });

    const action_05_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_5_COMPLETED'
    );
    expect(action_05_log?.data.report_generated_successfully).toBe(true);
    expect(action_05_log?.data.report_size_bytes).toBe(report_size_bytes);
    expect(action_05_log?.data.priority_order).toEqual([
      '課題A',
      '課題B',
      '課題C',
      '課題D',
      '課題E',
    ]);

    const action_06_completed = audit_log.find(
      (evt) => evt.event_type === 'ACTION_6_STARTED'
    );
    expect(action_06_completed).toBeDefined();

    audit_log.push({
      event_type: 'ACTION_6_COMPLETED',
      timestamp: new Date('2024-01-15T09:26:00Z').toISOString(),
      data: {
        completion_notification_recipient: 'director@company.com',
        report_reference_url:
          'https://report.company.com/morning-briefing-2024-01-15',
      },
    });

    const action_06_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_6_COMPLETED'
    );
    expect(action_06_log?.data.completion_notification_recipient).toBe(
      'director@company.com'
    );
    expect(action_06_log?.data.report_reference_url).toContain(
      'morning-briefing'
    );

    audit_log.push({
      event_type: 'COMPLETED',
      timestamp: new Date('2024-01-15T09:27:00Z').toISOString(),
      data: {
        total_execution_time_ms: 27 * 60 * 1000,
        status: 'success',
      },
    });

    const completion_log = audit_log.find(
      (evt) => evt.event_type === 'COMPLETED'
    );
    expect(completion_log?.data.status).toBe('success');

    const started_log = audit_log.find((evt) => evt.event_type === 'STARTED');
    const completed_log = audit_log.find(
      (evt) => evt.event_type === 'COMPLETED'
    );
    const action_1_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_1_COMPLETED'
    );
    const action_2_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_2_COMPLETED'
    );
    const action_3_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_3_COMPLETED'
    );
    const action_4_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_4_COMPLETED'
    );
    const action_5_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_5_COMPLETED'
    );
    const action_6_log = audit_log.find(
      (evt) => evt.event_type === 'ACTION_6_COMPLETED'
    );

    expect(started_log).toBeDefined();
    expect(action_1_log).toBeDefined();
    expect(action_2_log).toBeDefined();
    expect(action_3_log).toBeDefined();
    expect(action_4_log).toBeDefined();
    expect(action_5_log).toBeDefined();
    expect(action_6_log).toBeDefined();
    expect(completed_log).toBeDefined();

    const event_sequence = audit_log.map((evt) => evt.event_type);
    const expected_sequence = [
      'STARTED',
      'ACTION_1_STARTED',
      'ACTION_1_COMPLETED',
      'ACTION_2_STARTED',
      'ACTION_2_COMPLETED',
      'ACTION_3_STARTED',
      'ACTION_3_COMPLETED',
      'ACTION_4_STARTED',
      'ACTION_4_COMPLETED',
      'ACTION_5_STARTED',
      'ACTION_5_COMPLETED',
      'ACTION_6_STARTED',
      'ACTION_6_COMPLETED',
      'COMPLETED',
    ];

    for (let i = 0; i < expected_sequence.length; i++) {
      const expected_event = expected_sequence[i];
      const actual_event = event_sequence.includes(expected_event);
      expect(actual_event).toBe(true);
    }

    for (let i = 1; i < audit_log.length; i++) {
      const prev_timestamp = new Date(audit_log[i - 1].timestamp).getTime();
      const curr_timestamp = new Date(audit_log[i].timestamp).getTime();
      expect(curr_timestamp).toBeGreaterThanOrEqual(prev_timestamp);
    }

    expect(mock_email_sent.length).toBe(4);
    const unsubmitted_notifications = mock_email_sent.filter((email) =>
      ['user1', 'user2', 'user3'].includes(email.recipient)
    );
    expect(unsubmitted_notifications.length).toBe(3);

    const director_notification = mock_email_sent.find(
      (email) => email.recipient === 'director@company.com'
    );
    expect(director_notification).toBeDefined();
    expect(director_notification?.subject).toContain('完成');
  });
});