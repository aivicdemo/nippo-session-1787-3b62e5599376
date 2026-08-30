import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import type { Tx11AgentExecutionContext, Tx11AgentExecutionResult, PrioritizedIssueSummary } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('朝会報告管理システム - Tx11 エージェント統合実行', () => {
  // SCEN-033
  test('毎朝の定時にメンバーの日報提出状況を自動監視し、未提出者催促・課題抽出・サマリー生成を統合実行する', async () => {
    // テストダブル（スタブ）の準備
    const mockDetectUnsubmittedMembers = jest.fn().mockResolvedValue({
      unsubmittedMembers: [
        { memberId: 'eng-001', memberName: 'エンジニアA', remainingTimeMinutes: 30 },
        { memberId: 'eng-002', memberName: 'エンジニアB', remainingTimeMinutes: 30 }
      ],
      notificationRequired: true,
      dashboardUpdateRequired: true
    });

    const mockSendUnsubmittedMemberReminders = jest.fn().mockResolvedValue({
      sentCount: 2,
      failedMemberIds: [],
      sentAt: new Date('2025-01-15T09:00:00Z')
    });

    const mockExtractAndRankIssuesFromReports = jest.fn().mockResolvedValue({
      rankedIssues: [
        {
          issueKeyword: 'ビルド失敗',
          occurrenceFrequency: 5,
          affectedMemberCount: 3,
          priorityScore: 85,
          priorityLevel: 'high' as const,
          displayColor: 'red' as const
        },
        {
          issueKeyword: 'テスト環境不安定',
          occurrenceFrequency: 3,
          affectedMemberCount: 2,
          priorityScore: 65,
          priorityLevel: 'medium' as const,
          displayColor: 'yellow' as const
        },
        {
          issueKeyword: '依存関係遅延',
          occurrenceFrequency: 2,
          affectedMemberCount: 2,
          priorityScore: 55,
          priorityLevel: 'medium' as const,
          displayColor: 'yellow' as const
        },
        {
          issueKeyword: 'リソース不足',
          occurrenceFrequency: 4,
          affectedMemberCount: 4,
          priorityScore: 75,
          priorityLevel: 'high' as const,
          displayColor: 'red' as const
        },
        {
          issueKeyword: 'ドキュメント更新遅延',
          occurrenceFrequency: 1,
          affectedMemberCount: 1,
          priorityScore: 25,
          priorityLevel: 'low' as const,
          displayColor: 'green' as const
        }
      ],
      extractionTimestamp: new Date('2025-01-15T09:00:30Z'),
      totalReportsProcessed: 8
    });

    const mockPrepareDashboardData = jest.fn().mockResolvedValue({
      submissionRate: 80,
      unsubmittedMembersCount: 2,
      extractedIssuesCount: 5,
      prioritizedIssuesSummary: [
        {
          issueKeyword: 'ビルド失敗',
          occurrenceFrequency: 5,
          priorityScore: 85,
          colorCode: 'red' as const
        },
        {
          issueKeyword: 'リソース不足',
          occurrenceFrequency: 4,
          priorityScore: 75,
          colorCode: 'red' as const
        },
        {
          issueKeyword: 'テスト環境不安定',
          occurrenceFrequency: 3,
          priorityScore: 65,
          colorCode: 'yellow' as const
        },
        {
          issueKeyword: '依存関係遅延',
          occurrenceFrequency: 2,
          priorityScore: 55,
          colorCode: 'yellow' as const
        },
        {
          issueKeyword: 'ドキュメント更新遅延',
          occurrenceFrequency: 1,
          priorityScore: 25,
          colorCode: 'green' as const
        }
      ]
    });

    const mockGenerateAndSendManagerConfirmationEmail = jest.fn().mockResolvedValue({
      emailSent: true,
      sentAt: new Date('2025-01-15T09:01:00Z'),
      submittedCount: 8,
      notSubmittedMembers: [
        { memberId: 'eng-001', memberName: 'エンジニアA' },
        { memberId: 'eng-002', memberName: 'エンジニアB' }
      ],
      extractedIssues: [
        { keyword: 'ビルド失敗', frequency: 5, priority: 'high' as const },
        { keyword: 'リソース不足', frequency: 4, priority: 'high' as const },
        { keyword: 'テスト環境不安定', frequency: 3, priority: 'medium' as const },
        { keyword: '依存関係遅延', frequency: 2, priority: 'medium' as const },
        { keyword: 'ドキュメント更新遅延', frequency: 1, priority: 'low' as const }
      ],
      emailContent: '<html>朝会サマリー</html>'
    });

    // エージェント実行時にスタブを注入するため、モック用の AI クライアントオブジェクトを構築
    const mockAiClient = {
      detectUnsubmittedMembers: mockDetectUnsubmittedMembers,
      sendUnsubmittedMemberReminders: mockSendUnsubmittedMemberReminders,
      extractAndRankIssuesFromReports: mockExtractAndRankIssuesFromReports,
      prepareDashboardData: mockPrepareDashboardData,
      generateAndSendManagerConfirmationEmail: mockGenerateAndSendManagerConfirmationEmail
    };

    // Tx11AgentExecutionContext の入力値を構築
    const executionContext: Tx11AgentExecutionContext = {
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
      reportDeadlineTime: '09:30',
      targetTeamIds: ['team-001', 'team-002'],
      managerUserId: 'manager-user-001'
    };

    // runTx11Imp1Agent を呼び出す
    const result: Tx11AgentExecutionResult = await runTx11Imp1Agent(executionContext, mockAiClient as any);

    // 戻り値の executionStatus を検証
    expect(result.executionStatus).toBe('success');

    // 戻り値の unsubmittedMembersCount を検証
    expect(result.unsubmittedMembersCount).toBe(2);

    // 戻り値の extractedIssuesCount を検証
    expect(result.extractedIssuesCount).toBe(5);

    // 戻り値の managerConfirmationEmailSent を検証
    expect(result.managerConfirmationEmailSent).toBe(true);

    // 戻り値の prioritizedIssuesSummary の構造と要素数を検証
    expect(result.prioritizedIssuesSummary).toBeDefined();
    expect(Array.isArray(result.prioritizedIssuesSummary)).toBe(true);
    expect(result.prioritizedIssuesSummary.length).toBe(5);

    // prioritizedIssuesSummary の各要素が PrioritizedIssueSummary 型として優先度情報を保持していることを検証
    const expectedIssues: PrioritizedIssueSummary[] = [
      {
        issueKeyword: 'ビルド失敗',
        occurrenceFrequency: 5,
        priorityScore: 85,
        colorCode: 'red'
      },
      {
        issueKeyword: 'リソース不足',
        occurrenceFrequency: 4,
        priorityScore: 75,
        colorCode: 'red'
      },
      {
        issueKeyword: 'テスト環境不安定',
        occurrenceFrequency: 3,
        priorityScore: 65,
        colorCode: 'yellow'
      },
      {
        issueKeyword: '依存関係遅延',
        occurrenceFrequency: 2,
        priorityScore: 55,
        colorCode: 'yellow'
      },
      {
        issueKeyword: 'ドキュメント更新遅延',
        occurrenceFrequency: 1,
        priorityScore: 25,
        colorCode: 'green'
      }
    ];

    result.prioritizedIssuesSummary.forEach((issue, index) => {
      expect(issue.issueKeyword).toBe(expectedIssues[index].issueKeyword);
      expect(issue.occurrenceFrequency).toBe(expectedIssues[index].occurrenceFrequency);
      expect(issue.priorityScore).toBe(expectedIssues[index].priorityScore);
      expect(issue.colorCode).toBe(expectedIssues[index].colorCode);
    });

    // sendUnsubmittedMemberReminders が正確に1回呼び出されていることを検証
    expect(mockSendUnsubmittedMemberReminders).toHaveBeenCalledTimes(1);
    expect(mockSendUnsubmittedMemberReminders).toHaveBeenCalledWith(
      expect.objectContaining({
        unsubmittedMembers: expect.arrayContaining([
          expect.objectContaining({ memberId: 'eng-001', memberName: 'エンジニアA' }),
          expect.objectContaining({ memberId: 'eng-002', memberName: 'エンジニアB' })
        ])
      })
    );

    // extractAndRankIssuesFromReports が正確に1回呼び出されていることを検証
    expect(mockExtractAndRankIssuesFromReports).toHaveBeenCalledTimes(1);

    // generateAndSendManagerConfirmationEmail が正確に1回呼び出されていることを検証
    expect(mockGenerateAndSendManagerConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(mockGenerateAndSendManagerConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        managerUserId: 'manager-user-001'
      })
    );
  });
});