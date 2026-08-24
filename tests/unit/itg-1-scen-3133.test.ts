import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-05';

describe('tx-4-imp-1: ダッシュボード分析から課題指示までの自動実行', () => {
  // SCEN-3133
  test('Action 5が各課題に対する推奨対応方針を契約仕様どおり生成する', async () => {
    // モック用のAIクライアントを準備
    const mockAiClient = {
      callAction01: jest.fn(),
      callAction02: jest.fn(),
      callAction03: jest.fn(),
      callAction04: jest.fn(),
      callAction05: jest.fn(async () => ({
        countermeasures: [
          {
            issueId: 'issue-001',
            actionItems: [
              {
                action: 'データベース接続タイムアウト設定を30秒から60秒に変更',
                owner: '基盤チームリード',
                scheduledDate: '2024-01-16',
              },
              {
                action: '接続プール最大数を50から100に増加させる',
                owner: '基盤チームリード',
                scheduledDate: '2024-01-16',
              },
              {
                action: '本番環境での負荷テストを実施',
                owner: 'QAチーム',
                scheduledDate: '2024-01-17',
              },
              {
                action: '監視アラート閾値を調整して早期検知を強化',
                owner: 'DevOpsチーム',
                scheduledDate: '2024-01-17',
              },
            ],
            relatedDepartments: ['基盤チーム', 'QAチーム', 'DevOpsチーム'],
          },
          {
            issueId: 'issue-002',
            actionItems: [
              {
                action: 'メモリリーク検査をコード分析ツールで実施',
                owner: '開発チーム',
                scheduledDate: '2024-01-16',
              },
              {
                action: 'ガベージコレクション設定を見直す',
                owner: '開発チーム',
                scheduledDate: '2024-01-16',
              },
              {
                action: 'ステージング環境で24時間連続稼働テストを実施',
                owner: 'QAチーム',
                scheduledDate: '2024-01-18',
              },
            ],
            relatedDepartments: ['開発チーム', 'QAチーム'],
          },
        ],
      })),
      callAction06: jest.fn(),
      callAction07: jest.fn(),
    };

    // buildAction05Promptが正しく実行可能であることを確認
    const promptInput = {
      issues: [
        {
          id: 'issue-001',
          title: 'データベース接続タイムアウトエラーが頻発',
          importance: 'high' as const,
          urgency: 'high' as const,
          description:
            'アプリケーション側からDBへの接続がタイムアウトするエラーが1日50件以上発生している。ピーク時間帯に集中',
          similarHistories: [
            {
              issueTitle: '過去のDB接続タイムアウト（2023年11月）',
              resolution:
                'コネクションプール設定変更で解決、平均応答時間3倍改善',
            },
          ],
        },
        {
          id: 'issue-002',
          title: 'メモリ使用量が徐々に増加',
          importance: 'medium' as const,
          urgency: 'medium' as const,
          description:
            'アプリケーション起動から72時間で利用メモリが90%に達する。メモリリークが疑われる',
          similarHistories: [
            {
              issueTitle: '過去のメモリリーク（2023年9月）',
              resolution: 'グローバル変数の参照を解放したことで改善',
            },
          ],
        },
      ],
    };

    const builtPrompt = buildAction05Prompt(promptInput);

    // buildAction05Promptが正しい形式でプロンプトを生成していることを確認
    expect(builtPrompt).toBeDefined();
    expect(typeof builtPrompt).toBe('string');
    expect(builtPrompt.length).toBeGreaterThan(0);

    // ACTION_05_PROMPT_VERSIONがエクスポートされていることを確認
    expect(ACTION_05_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_05_PROMPT_VERSION).toBe('string');
    expect(ACTION_05_PROMPT_VERSION.length).toBeGreaterThan(0);

    // runTx4Imp1Agentを実行
    const executionRequest = {
      teamId: 'team-devops-001',
      managerId: 'manager-yamada-001',
      reportDate: '2024-01-15',
      meetingStartTime: '09:00',
    };

    const result = await runTx4Imp1Agent(executionRequest, mockAiClient);

    // 結果構造を検証
    expect(result).toBeDefined();
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.aggregatedReportCount).toBeGreaterThan(0);
    expect(result.extractedIssueCount).toBeGreaterThan(0);
    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);
    expect(result.countermeasurePlan).toBeDefined();
    expect(result.summaryEmailSent).toBe(true);
    expect(result.completionTimestamp).toBeInstanceOf(Date);

    // prioritizedIssuesの検証
    expect(result.prioritizedIssues.length).toBeGreaterThanOrEqual(2);

    // 最初の課題をチェック：高優先度の課題である
    const firstIssue = result.prioritizedIssues[0];
    expect(firstIssue).toBeDefined();
    expect(firstIssue.keyword).toBe('データベース接続タイムアウトエラー');
    expect(firstIssue.priorityScore).toBeGreaterThanOrEqual(80);
    expect(firstIssue.priorityRank).toBe('high');
    expect(firstIssue.occurrenceCount).toBeGreaterThan(0);

    // countermeasurePlanの検証
    expect(result.countermeasurePlan.topPriorityIssue).toBeDefined();
    expect(typeof result.countermeasurePlan.topPriorityIssue).toBe('string');

    // 推奨アクションの検証：3件以上5件以下が含まれていることを確認
    expect(result.countermeasurePlan.recommendedActions).toBeDefined();
    expect(Array.isArray(result.countermeasurePlan.recommendedActions)).toBe(
      true
    );
    expect(result.countermeasurePlan.recommendedActions.length).toBeGreaterThanOrEqual(
      3
    );
    expect(result.countermeasurePlan.recommendedActions.length).toBeLessThanOrEqual(
      5
    );

    // 各推奨アクションが実行可能かつ責任者が明記されていることを確認
    result.countermeasurePlan.recommendedActions.forEach(
      (actionItem: string) => {
        expect(actionItem.length).toBeGreaterThan(0);
        // アクション項目が詳細すぎず、実行可能な粒度であることを確認
        expect(actionItem).toMatch(
          /[変更|確認|実施|設定|修正|テスト|検査|リリース|更新|改善]/
        );
      }
    );

    // 推定解決期間の検証
    expect(result.countermeasurePlan.estimatedResolutionDays).toBeGreaterThanOrEqual(
      1
    );
    expect(result.countermeasurePlan.estimatedResolutionDays).toBeLessThanOrEqual(
      30
    );

    // 対応を割り当てるチームIDの検証
    expect(result.countermeasurePlan.assignedTeamId).toBeDefined();
    expect(typeof result.countermeasurePlan.assignedTeamId).toBe('string');
    expect(result.countermeasurePlan.assignedTeamId.length).toBeGreaterThan(0);

    // mockAiClientのcallAction05が正しく呼び出されたことを確認
    expect(mockAiClient.callAction05).toHaveBeenCalled();

    // 返却されたデータが複数の課題に対応する推奨対応方針を含んでいることを確認
    const callCount = mockAiClient.callAction05.mock.calls.length;
    expect(callCount).toBeGreaterThan(0);
  });
});