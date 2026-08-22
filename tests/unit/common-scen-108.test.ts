import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-108: AIエージェントが未提出メンバーを特定してリマインド通知を送信する', async () => {
    // テストデータ: 前週月曜日から日曜日までの日報提出状況（10名中8名提出済み、2名未提出）
    const submission_status_list = [
      {
        member_id: 'emp_001',
        member_name: '田中太郎',
        submitted: true,
        submission_date: '2024-01-15T09:00:00Z',
      },
      {
        member_id: 'emp_002',
        member_name: '鈴木花子',
        submitted: true,
        submission_date: '2024-01-15T08:30:00Z',
      },
      {
        member_id: 'emp_003',
        member_name: '佐藤次郎',
        submitted: false,
        submission_date: null,
      },
      {
        member_id: 'emp_004',
        member_name: '伊藤美咲',
        submitted: true,
        submission_date: '2024-01-15T10:15:00Z',
      },
      {
        member_id: 'emp_005',
        member_name: '渡辺健一',
        submitted: true,
        submission_date: '2024-01-15T09:45:00Z',
      },
      {
        member_id: 'emp_006',
        member_name: '中村由美',
        submitted: true,
        submission_date: '2024-01-15T08:00:00Z',
      },
      {
        member_id: 'emp_007',
        member_name: '山田浩二',
        submitted: false,
        submission_date: null,
      },
      {
        member_id: 'emp_008',
        member_name: '木村麻衣',
        submitted: true,
        submission_date: '2024-01-15T10:00:00Z',
      },
      {
        member_id: 'emp_009',
        member_name: '橋本裕介',
        submitted: true,
        submission_date: '2024-01-15T09:30:00Z',
      },
      {
        member_id: 'emp_010',
        member_name: '高橋智也',
        submitted: true,
        submission_date: '2024-01-15T07:45:00Z',
      },
    ];

    const submission_deadline = '2024-01-15T17:00:00Z';
    const report_date = '2024-01-15';
    const report_base_url = 'https://app.example.com/reports';

    // 関数実行
    const result = await sendUnsubmittedReminder({
      submission_status: submission_status_list,
      deadline: submission_deadline,
      report_date: report_date,
      report_url_base: report_base_url,
    });

    // 期待値の検証

    // 1. 未提出メンバーが正確に特定されたことを確認（2名: emp_003, emp_007）
    expect(result.unsubmitted_members).toHaveLength(2);
    expect(result.unsubmitted_members[0].member_id).toBe('emp_003');
    expect(result.unsubmitted_members[0].member_name).toBe('佐藤次郎');
    expect(result.unsubmitted_members[1].member_id).toBe('emp_007');
    expect(result.unsubmitted_members[1].member_name).toBe('山田浩二');

    // 2. リマインド通知ペイロードの検証（2件の通知が生成されたことを確認）
    expect(result.reminder_notifications).toHaveLength(2);

    // 3. 最初のリマインド通知（emp_003向け）の検証
    const notification_1 = result.reminder_notifications[0];
    expect(notification_1.recipient_id).toBe('emp_003');
    expect(notification_1.recipient_name).toBe('佐藤次郎');
    expect(notification_1.report_url).toBe(
      `${report_base_url}?date=${report_date}&member_id=emp_003`,
    );
    expect(notification_1.submission_deadline).toBe(submission_deadline);
    expect(notification_1.notification_type).toBe('UNSUBMITTED_REMINDER');

    // 4. 2番目のリマインド通知（emp_007向け）の検証
    const notification_2 = result.reminder_notifications[1];
    expect(notification_2.recipient_id).toBe('emp_007');
    expect(notification_2.recipient_name).toBe('山田浩二');
    expect(notification_2.report_url).toBe(
      `${report_base_url}?date=${report_date}&member_id=emp_007`,
    );
    expect(notification_2.submission_deadline).toBe(submission_deadline);
    expect(notification_2.notification_type).toBe('UNSUBMITTED_REMINDER');

    // 5. 監査ログの検証
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.action).toBe('REMINDER_SENT');
    expect(result.audit_log.sender).toBe('AIAgent');
    expect(result.audit_log.recipient_ids).toEqual(['emp_003', 'emp_007']);
    expect(result.audit_log.notification_count).toBe(2);
    expect(result.audit_log.timestamp).toBeDefined();

    // 6. 提出済みメンバーに対する通知が生成されていないことを確認
    const submitted_member_ids = [
      'emp_001',
      'emp_002',
      'emp_004',
      'emp_005',
      'emp_006',
      'emp_008',
      'emp_009',
      'emp_010',
    ];
    const notification_recipients = result.reminder_notifications.map(
      (n: { recipient_id: string }) => n.recipient_id,
    );
    for (const submitted_id of submitted_member_ids) {
      expect(notification_recipients).not.toContain(submitted_id);
    }

    // 7. リマインド通知送信が成功したことを確認
    expect(result.success).toBe(true);
  });
});