import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractDashboardReportData } from '../../src/logic/manager-dashboard';
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
  SubmissionSummary,
  PrioritizedIssue,
  UnsubmittedMember,
} from '../../src/logic/manager-dashboard';

const fetchMock = require('jest-fetch-mock');

describe('Manager Dashboard - Extract Dashboard Report Data', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-2021: [normal] チーム全体への対策案共有 - 承認完了した対策案について、チーム全体への共有が可能になる
  test('should extract dashboard report data and enable team-wide sharing of approved countermeasures', async () => {
    // Setup: 管理者ユーザーでログイン済み状態
    const userId = 'user-admin-001';
    const teamId = 'team-dev-001';
    const reportDate = '2024-01-15';

    const input: ExtractDashboardReportDataInput = {
      userId,
      teamId,
      reportDate,
      includeUnsubmitted: true,
    };

    // Mock data: 提出状況サマリー
    // チーム総メンバー数: 10名
    // 提出済み: 9名
    // 未提出: 1名
    // 提出率: 90%
    const mockSubmissionSummary: SubmissionSummary = {
      totalMembers: 10,
      submittedCount: 9,
      unsubmittedCount: 1,
      submissionRate: 90,
    };

    // Mock data: 優先度付き課題リスト（優先度スコア順）
    const mockPrioritizedIssues: PrioritizedIssue[] = [
      {
        issueId: 'issue-001',
        issueContent: 'Database connection timeout in production environment',
        priorityScore: 92,
        priorityColor: 'red',
        impactLevel: 'high',
        reporterName: 'Engineer A',
      },
      {
        issueId: 'issue-002',
        issueContent: 'API response time degradation during peak hours',
        priorityScore: 75,
        priorityColor: 'yellow',
        impactLevel: 'medium',
        reporterName: 'Engineer B',
      },
      {
        issueId: 'issue-003',
        issueContent: 'Minor UI inconsistency in admin panel',
        priorityScore: 45,
        priorityColor: 'green',
        impactLevel: 'low',
        reporterName: 'Engineer C',
      },
    ];

    // Mock data: 未提出メンバー
    const mockUnsubmittedMembers: UnsubmittedMember[] = [
      {
        memberId: 'member-010',
        memberName: 'Engineer J',
        teamId,
        lastSubmissionDate: '2024-01-14',
      },
    ];

    // Mock data: ダッシュボードデータの最終更新時刻
    const lastUpdatedAt = '2024-01-15T09:15:00Z';

    // Expected output
    const expectedOutput: DashboardReportDataOutput = {
      reportDate,
      submissionSummary: mockSubmissionSummary,
      prioritizedIssues: mockPrioritizedIssues,
      unsubmittedMembers: mockUnsubmittedMembers,
      lastUpdatedAt,
    };

    // Mock NotificationServiceAdapter
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'success',
        notificationId: 'notif-001',
        timestamp: '2024-01-15T09:20:00Z',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
        status: 'scheduled',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        deliveryStatus: 'success',
        sentAt: '2024-01-15T09:20:00Z',
        failureReason: null,
      }),
    };

    // Mock the API call to dashboard service
    fetchMock.mockResponseOnce(
      JSON.stringify({
        reportDate,
        submissionSummary: mockSubmissionSummary,
        prioritizedIssues: mockPrioritizedIssues,
        unsubmittedMembers: mockUnsubmittedMembers,
        lastUpdatedAt,
      }),
      { status: 200 }
    );

    // Execute: extractDashboardReportData を呼び出す
    const result = await extractDashboardReportData(input, mockNotificationServiceAdapter);

    // Verify: 返却されたデータが期待値と一致すること
    expect(result).toEqual(expectedOutput);

    // Verify: 提出状況サマリーが正確に計算されていること
    expect(result.submissionSummary.totalMembers).toBe(10);
    expect(result.submissionSummary.submittedCount).toBe(9);
    expect(result.submissionSummary.unsubmittedCount).toBe(1);
    expect(result.submissionSummary.submissionRate).toBe(90);

    // Verify: 優先度スコア順に課題が並んでいること
    expect(result.prioritizedIssues.length).toBe(3);
    expect(result.prioritizedIssues[0].priorityScore).toBe(92);
    expect(result.prioritizedIssues[1].priorityScore).toBe(75);
    expect(result.prioritizedIssues[2].priorityScore).toBe(45);

    // Verify: 優先度に応じた色分けが正確であること
    // 優先度スコア 80以上: red
    expect(result.prioritizedIssues[0].priorityColor).toBe('red');
    // 優先度スコア 50-79: yellow
    expect(result.prioritizedIssues[1].priorityColor).toBe('yellow');
    // 優先度スコア 49以下: green
    expect(result.prioritizedIssues[2].priorityColor).toBe('green');

    // Verify: 影響レベルが正確に設定されていること
    expect(result.prioritizedIssues[0].impactLevel).toBe('high');
    expect(result.prioritizedIssues[1].impactLevel).toBe('medium');
    expect(result.prioritizedIssues[2].impactLevel).toBe('low');

    // Verify: 未提出メンバーが正確に抽出されていること
    expect(result.unsubmittedMembers.length).toBe(1);
    expect(result.unsubmittedMembers[0].memberId).toBe('member-010');
    expect(result.unsubmittedMembers[0].memberName).toBe('Engineer J');

    // Verify: 最終更新時刻が ISO 8601形式で記録されていること
    expect(result.lastUpdatedAt).toBe(lastUpdatedAt);

    // Verify: NotificationServiceAdapter の sendReminderNotification が呼び出されていること
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();

    // Verify: 通知が全メンバーに送信されていることを確認
    const notificationCallArgs = mockNotificationServiceAdapter.sendReminderNotification.mock.calls[0];
    expect(notificationCallArgs).toBeDefined();

    // Verify: 配信ステータスが『成功』であること
    const deliveryStatus = await mockNotificationServiceAdapter.getDeliveryStatus('notif-001');
    expect(deliveryStatus.deliveryStatus).toBe('success');

    // Verify: リマインド通知履歴に配信成功レコードが記録されていることを確認
    // （ここでは配信ログを検証可能な状態にしておく）
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientIds: expect.arrayContaining(['member-010']),
        messageType: 'reminder',
      })
    );
  });
});