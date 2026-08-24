import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-2-imp-1/prompts/action-02';

describe('日報収集から課題抽出・配信までの自律実行 AIエージェント', () => {
  // SCEN-3098
  test('受信した日報を統一フォーマットに自動変換する', async () => {
    const executionTimestamp = new Date('2024-01-15T08:55:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const targetTeamIds = ['team-001'];
    const managerUserIds = ['mgr-001'];

    const input = {
      executionTimestamp,
      reportDeadlineTime,
      targetTeamIds,
      managerUserIds,
    };

    const mockReports = [
      {
        memberId: 'user-001',
        memberName: 'エンジニアA',
        content: '昨日：APIの実装完了。今日：テスト実施。課題：テスト環境のセットアップに時間がかかっている',
        format: 'text',
      },
      {
        memberId: 'user-002',
        memberName: 'エンジニアB',
        content: 'previousTasksCompleted,todaysTasks,currentChallenges\nデータベース設計,マイグレーション実装,スキーマ検証が未完了',
        format: 'csv',
      },
      {
        memberId: 'user-003',
        memberName: 'エンジニアC',
        content: JSON.stringify({
          previousTasksCompleted: 'UI実装',
          todaysTasks: 'レスポンシブ対応',
          currentChallenges: 'ブラウザ互換性の問題',
        }),
        format: 'json',
      },
      {
        memberId: 'user-004',
        memberName: 'エンジニアD',
        content: '昨日：ドキュメント作成。今日：レビュー。課題：なし',
        format: 'text',
      },
      {
        memberId: 'user-005',
        memberName: 'エンジニアE',
        content: 'infraSetup,kubernetesDeployment,clusterScaling',
        format: 'csv',
      },
      {
        memberId: 'user-006',
        memberName: 'エンジニアF',
        content: JSON.stringify({
          previousTasksCompleted: 'セキュリティ監査',
          todaysTasks: '脆弱性対応',
          currentChallenges: 'ペネトレーションテスト結果対応',
        }),
        format: 'json',
      },
      {
        memberId: 'user-007',
        memberName: 'エンジニアG',
        content: '昨日：パフォーマンス計測。今日：最適化実施。課題：メモリリーク検出',
        format: 'text',
      },
      {
        memberId: 'user-008',
        memberName: 'エンジニアH',
        content: 'cachedData,indexOptimization,queryTuning',
        format: 'csv',
      },
      {
        memberId: 'user-009',
        memberName: 'エンジニアI',
        content: JSON.stringify({
          previousTasksCompleted: 'CI/CD設定',
          todaysTasks: 'デプロイ自動化',
          currentChallenges: 'GitHub Actionsトラブルシューティング',
        }),
        format: 'json',
      },
      {
        memberId: 'user-010',
        memberName: 'エンジニアJ',
        content: '昨日：スプリント計画。今日：ストーリーポイント見積。課題：要件の曖昧さ',
        format: 'text',
      },
    ];

    const auditLogs: Array<{
      timestamp: Date;
      action: string;
      memberId: string;
      dataType: string;
    }> = [];

    const fakeTx2Imp1AiClient = {
      executeAction01_GetReportStatus: jest.fn().mockResolvedValue({
        submittedCount: 10,
        unsubmittedCount: 0,
        totalCount: 10,
      }),

      executeAction02_UnifyReportFormat: jest.fn(async (reports_input: unknown) => {
        const actionPrompt = buildAction02Prompt(reports_input as typeof mockReports);
        expect(ACTION_02_PROMPT_VERSION).toBeDefined();
        expect(typeof ACTION_02_PROMPT_VERSION).toBe('string');

        const unifiedReports = mockReports.map((report) => {
          auditLogs.push({
            timestamp: executionTimestamp,
            action: 'format_unification',
            memberId: report.memberId,
            dataType: report.format,
          });

          if (report.format === 'text') {
            const textParts = report.content.split('。');
            return {
              memberId: report.memberId,
              memberName: report.memberName,
              previousTasksCompleted: textParts[0]?.replace('昨日：', '') || '',
              todaysTasks: textParts[1]?.replace('今日：', '') || '',
              currentChallenges: textParts[2]?.replace('課題：', '') || '',
              submissionTimestamp: executionTimestamp,
            };
          } else if (report.format === 'csv') {
            const lines = report.content.split('\n');
            const values = lines[1]?.split(',') || [];
            return {
              memberId: report.memberId,
              memberName: report.memberName,
              previousTasksCompleted: values[0] || '',
              todaysTasks: values[1] || '',
              currentChallenges: values[2] || '',
              submissionTimestamp: executionTimestamp,
            };
          } else if (report.format === 'json') {
            const parsed = JSON.parse(report.content);
            return {
              memberId: report.memberId,
              memberName: report.memberName,
              previousTasksCompleted: parsed.previousTasksCompleted || '',
              todaysTasks: parsed.todaysTasks || '',
              currentChallenges: parsed.currentChallenges || '',
              submissionTimestamp: executionTimestamp,
            };
          }
          return null;
        });

        return {
          unifiedReports: unifiedReports.filter((r) => r !== null),
          conversionCount: unifiedReports.filter((r) => r !== null).length,
        };
      }),

      executeAction03_ExtractIssues: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            keyword: 'テスト環境セットアップ',
            frequency: 1,
            impactScore: 65,
          },
          {
            keyword: 'スキーマ検証',
            frequency: 1,
            impactScore: 60,
          },
          {
            keyword: 'ブラウザ互換性',
            frequency: 1,
            impactScore: 55,
          },
        ],
      }),

      executeAction04_PrioritizeIssues: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            keyword: 'テスト環境セットアップ',
            priorityScore: 75,
            priorityRank: 'high',
          },
          {
            keyword: 'スキーマ検証',
            priorityScore: 70,
            priorityRank: 'high',
          },
          {
            keyword: 'ブラウザ互換性',
            priorityScore: 65,
            priorityRank: 'medium',
          },
        ],
      }),

      executeAction05_GenerateConfirmationEmail: jest.fn().mockResolvedValue({
        emailContent: {
          reportDate: new Date('2024-01-15'),
          submissionSummary: '提出済み：10件 / 未提出：0件',
          topPriorityChallenges: [
            {
              keyword: 'テスト環境セットアップ',
              priorityScore: 75,
              priorityRank: 'high',
            },
            {
              keyword: 'スキーマ検証',
              priorityScore: 70,
              priorityRank: 'high',
            },
            {
              keyword: 'ブラウザ互換性',
              priorityScore: 65,
              priorityRank: 'medium',
            },
            {
              keyword: 'メモリリーク',
              priorityScore: 60,
              priorityRank: 'medium',
            },
            {
              keyword: '要件の曖昧さ',
              priorityScore: 55,
              priorityRank: 'medium',
            },
          ],
        },
        success: true,
      }),

      executeAction06_SendConfirmationEmail: jest.fn().mockResolvedValue({
        sent: true,
        recipientCount: 1,
        timestamp: executionTimestamp,
      }),
    };

    const result = await runTx2Imp1Agent(input, fakeTx2Imp1AiClient);

    expect(fakeTx2Imp1AiClient.executeAction02_UnifyReportFormat).toHaveBeenCalled();
    const action02CallArgs = (
      fakeTx2Imp1AiClient.executeAction02_UnifyReportFormat as jest.Mock
    ).mock.calls[0][0];
    expect(Array.isArray(action02CallArgs)).toBe(true);
    expect((action02CallArgs as Array<unknown>).length).toBe(10);

    expect(result.aggregatedReportCount).toBe(10);
    expect(result.extractedIssueCount).toBe(3);
    expect(result.prioritizedIssues).toEqual([
      {
        keyword: 'テスト環境セットアップ',
        priorityScore: 75,
        priorityRank: 'high',
      },
      {
        keyword: 'スキーマ検証',
        priorityScore: 70,
        priorityRank: 'high',
      },
      {
        keyword: 'ブラウザ互換性',
        priorityScore: 65,
        priorityRank: 'medium',
      },
    ]);
    expect(result.confirmationEmailSent).toBe(true);

    expect(auditLogs.length).toBe(10);
    auditLogs.forEach((log) => {
      expect(log.timestamp).toEqual(executionTimestamp);
      expect(log.action).toBe('format_unification');
      expect(['text', 'csv', 'json']).toContain(log.dataType);
    });

    expect(buildAction02Prompt).toBeDefined();
    expect(ACTION_02_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_02_PROMPT_VERSION).toBe('string');
  });
});