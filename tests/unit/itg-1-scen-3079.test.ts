import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

const fetchMock = require('jest-fetch-mock');

describe('tx-1-imp-1: 日報集約から課題優先順位付けと未提出通知までの自律実行', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  it('SCEN-3079: AIエージェントが定時トリガーから完成通知送信まで自律実行完了する', async () => {
    // Arrange: テスト用の入力データを準備
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:30:00Z');
    const targetTeamIds = ['team-001'];
    const managerUserId = 'manager-001';

    const agentInput: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      targetTeamIds,
      managerUserId,
    };

    // 提出済み日報データ（10件）
    const submittedReports = [
      {
        userId: 'user-001',
        teamId: 'team-001',
        submittedAt: new Date('2024-01-14T08:30:00Z'),
        yesterdayWork: 'Completed API integration',
        todayWork: 'Start database optimization',
        issues: 'Performance bottleneck in query processing',
      },
      {
        userId: 'user-002',
        teamId: 'team-001',
        submittedAt: new Date('2024-01-14T08:45:00Z'),
        yesterdayWork: 'Fixed UI bugs',
        todayWork: 'Implement user authentication',
        issues: 'Authentication service timeout',
      },
      {
        userId: 'user-003',
        teamId: 'team-001',
        submittedAt: new Date('2024-01-14T08:15:00Z'),
        yesterdayWork: 'Reviewed pull requests',
        todayWork: 'Deploy staging build',
        issues: 'Database schema conflict',
      },
      {
        userId: 'user-004',
        teamId: 'team-001',
        submittedAt: new Date('2024-01-14T09:00:00Z'),
        yesterdayWork: 'Updated documentation',
        todayWork: 'Performance testing',
        issues: 'Performance bottleneck in query processing',
      },
      {
        userId: 'user-005',
        teamId: 'team-001',
        submittedAt: new Date('2024-01-14T08:20:00Z'),
        yesterdayWork: 'Prepared test cases',
        todayWork: 'Run regression tests',
        issues: 'Authentication service timeout',
      },
      {
        userId: 'user-006',
        teamId: 'team-001',
        submittedAt: new Date('2024-01-14T08:50:00Z'),
        yesterdayWork: 'Code refactoring',
        todayWork: 'Write unit tests',
        issues: 'Database schema conflict',
      },
      {
        userId: 'user-007',
        teamId: 'team-001',
        submittedAt: new Date('2024-01-14T08:30:00Z'),
        yesterdayWork: 'Setup CI pipeline',
        todayWork: 'Configure monitoring',
        issues: 'Deployment pipeline failure',
      },
      {
        userId: 'user-008',
        teamId: 'team-001',
        submittedAt: new Date('2024-01-14T08:40:00Z'),
        yesterdayWork: 'Met with stakeholders',
        todayWork: 'Gather requirements',
        issues: 'Requirements scope unclear',
      },
      {
        userId: 'user-009',
        teamId: 'team-001',
        submittedAt: new Date('2024-01-14T09:05:00Z'),
        yesterdayWork: 'Created task board',
        todayWork: 'Assign tasks',
        issues: 'Performance bottleneck in query processing',
      },
      {
        userId: 'user-010',
        teamId: 'team-001',
        submittedAt: new Date('2024-01-14T08:35:00Z'),
        yesterdayWork: 'Analyzed logs',
        todayWork: 'Debug production issue',
        issues: 'Authentication service timeout',
      },
    ];

    // 未提出者データ（3名）
    const unsubmittedUsers = [
      { userId: 'user-011', teamId: 'team-001', name: 'Alice' },
      { userId: 'user-012', teamId: 'team-001', name: 'Bob' },
      { userId: 'user-013', teamId: 'team-001', name: 'Charlie' },
    ];

    // モック用の Tx1Imp1AiClient
    const mockAiClient = {
      // Action 1: 定時に日報システムから全員の提出状況を取得
      getReportSubmissionStatus: jest
        .fn()
        .mockResolvedValue({
          submitted: submittedReports,
          unsubmitted: unsubmittedUsers,
          totalTeamMembers: 13,
        }),

      // Action 2: 未提出者リストを作成し自動通知メッセージを送信
      sendReminderNotifications: jest.fn().mockResolvedValue({
        notifiedCount: 3,
        failedCount: 0,
      }),

      // Action 3: 提出済み日報から課題を抽出・分類
      extractAndClassifyIssues: jest.fn().mockResolvedValue({
        issues: [
          {
            keyword: 'Performance bottleneck in query processing',
            frequency: 3,
            severity: 'high',
            impactScore: 85,
          },
          {
            keyword: 'Authentication service timeout',
            frequency: 3,
            severity: 'high',
            impactScore: 78,
          },
          {
            keyword: 'Database schema conflict',
            frequency: 2,
            severity: 'medium',
            impactScore: 62,
          },
          {
            keyword: 'Deployment pipeline failure',
            frequency: 1,
            severity: 'medium',
            impactScore: 55,
          },
          {
            keyword: 'Requirements scope unclear',
            frequency: 1,
            severity: 'low',
            impactScore: 38,
          },
        ],
      }),

      // Action 4: 優先度付与（既に extractAndClassifyIssues で実施）

      // Action 5: 朝会資料生成
      generateMeetingMaterial: jest.fn().mockResolvedValue({
        materialUrl: 'https://example.com/meeting-material-20240115',
        prioritizedIssuesCount: 5,
      }),

      // Action 6: 完成通知送信
      sendCompletionNotification: jest.fn().mockResolvedValue({
        notificationSent: true,
        recipientUserId: managerUserId,
      }),
    };

    // Mock NotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ status: 'sent', userId: '' }),
      scheduleNotification: jest.fn().mockResolvedValue({}),
      getDeliveryStatus: jest
        .fn()
        .mockResolvedValue({ status: 'delivered' }),
    };

    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'Performance bottleneck in query processing', count: 3 },
          { keyword: 'Authentication service timeout', count: 3 },
          { keyword: 'Database schema conflict', count: 2 },
          { keyword: 'Deployment pipeline failure', count: 1 },
          { keyword: 'Requirements scope unclear', count: 1 },
        ],
      }),
      assessImpactScore: jest
        .fn()
        .mockResolvedValue({ impactScore: 75 }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValue({ severity: 'high' }),
    };

    // Act: runTx1Imp1Agent を実行
    const result = await runTx1Imp1Agent(agentInput, mockAiClient);

    // Assert: 戻り値を検証
    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('success');
    expect(result.reportAggregationSummary).toBeDefined();
    expect(result.reportAggregationSummary.totalTeamMembers).toBe(13);
    expect(result.reportAggregationSummary.submittedCount).toBe(10);
    expect(result.reportAggregationSummary.unsubmittedMembers).toHaveLength(3);
    expect(result.reportAggregationSummary.unsubmittedMembers[0].userId).toBe(
      'user-011'
    );
    expect(result.reportAggregationSummary.unsubmittedMembers[1].userId).toBe(
      'user-012'
    );
    expect(result.reportAggregationSummary.unsubmittedMembers[2].userId).toBe(
      'user-013'
    );

    // Action 1: 定時日報取得を確認
    expect(mockAiClient.getReportSubmissionStatus).toHaveBeenCalledWith({
      executionTimestamp,
      targetTeamIds,
    });

    // Action 2: 未提出通知を確認
    expect(mockAiClient.sendReminderNotifications).toHaveBeenCalledWith({
      unsubmittedUsers,
      reportDeadlineTime,
      morningMeetingStartTime,
    });

    // Action 3: 課題抽出・分類を確認
    expect(mockAiClient.extractAndClassifyIssues).toHaveBeenCalledWith({
      submittedReports,
    });

    // 優先度付きの課題一覧を確認
    expect(result.prioritizedIssuesList).toBeDefined();
    expect(result.prioritizedIssuesList).toHaveLength(5);

    // 優先度が降順に並んでいることを確認
    expect(result.prioritizedIssuesList[0].priorityScore).toBeGreaterThanOrEqual(
      result.prioritizedIssuesList[1].priorityScore
    );
    expect(result.prioritizedIssuesList[1].priorityScore).toBeGreaterThanOrEqual(
      result.prioritizedIssuesList[2].priorityScore
    );
    expect(result.prioritizedIssuesList[2].priorityScore).toBeGreaterThanOrEqual(
      result.prioritizedIssuesList[3].priorityScore
    );
    expect(result.prioritizedIssuesList[3].priorityScore).toBeGreaterThanOrEqual(
      result.prioritizedIssuesList[4].priorityScore
    );

    // 最初の課題が最も高い優先度を持っていることを確認
    expect(result.prioritizedIssuesList[0].keyword).toBe(
      'Performance bottleneck in query processing'
    );
    expect(result.prioritizedIssuesList[0].priorityScore).toBe(85);
    expect(result.prioritizedIssuesList[0].frequency).toBe(3);

    // Action 5: 朝会資料生成を確認
    expect(mockAiClient.generateMeetingMaterial).toHaveBeenCalledWith({
      prioritizedIssues: result.prioritizedIssuesList,
      unsubmittedMembers: result.reportAggregationSummary.unsubmittedMembers,
    });

    expect(result.morningMeetingMaterialUrl).toBe(
      'https://example.com/meeting-material-20240115'
    );

    // Action 6: 完成通知を確認
    expect(mockAiClient.sendCompletionNotification).toHaveBeenCalledWith({
      managerUserId,
      issueCount: 5,
      materialUrl: result.morningMeetingMaterialUrl,
    });

    expect(result.unsubmittedMembersNotified).toBe(true);

    // 実行完了時刻が設定されていることを確認
    expect(result.executionTimestamp).toBeDefined();
    expect(result.executionTimestamp).toBeInstanceOf(Date);

    // 処理ログが時系列順に記録されていることを確認
    const actionCallOrder = [
      mockAiClient.getReportSubmissionStatus,
      mockAiClient.sendReminderNotifications,
      mockAiClient.extractAndClassifyIssues,
      mockAiClient.generateMeetingMaterial,
      mockAiClient.sendCompletionNotification,
    ];

    // 各アクションが呼び出されたことを確認
    for (const action of actionCallOrder) {
      expect(action).toHaveBeenCalled();
    }
  });
});