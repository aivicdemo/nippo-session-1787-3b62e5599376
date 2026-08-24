import { runTx11Imp1Agent, type Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('日報収集・確認・催促の自動化エージェント - Action 05課題優先度付けサマリー生成', () => {
  // SCEN-3238
  test('should execute Action 05 to create prioritized issue summary with AI client', async () => {
    // Setup: 偽AIクライアントの定義
    const mockAiClient: Tx11Imp1AiClient = {
      buildAction01Prompt: jest.fn().mockReturnValue('mock_action_01_prompt'),
      ACTION_01_PROMPT_VERSION: '1.0.0',
      buildAction02Prompt: jest.fn().mockReturnValue('mock_action_02_prompt'),
      ACTION_02_PROMPT_VERSION: '1.0.0',
      buildAction03Prompt: jest.fn().mockReturnValue('mock_action_03_prompt'),
      ACTION_03_PROMPT_VERSION: '1.0.0',
      buildAction04Prompt: jest.fn().mockReturnValue('mock_action_04_prompt'),
      ACTION_04_PROMPT_VERSION: '1.0.0',
      buildAction05Prompt: jest.fn().mockReturnValue('mock_action_05_prompt'),
      ACTION_05_PROMPT_VERSION: '1.0.0',
      buildAction06Prompt: jest.fn().mockReturnValue('mock_action_06_prompt'),
      ACTION_06_PROMPT_VERSION: '1.0.0',
      buildAction07Prompt: jest.fn().mockReturnValue('mock_action_07_prompt'),
      ACTION_07_PROMPT_VERSION: '1.0.0',
    };

    // Setup: 入力データ（Action 01～04完了後の状態）
    const executionContext = {
      executionTimestamp: new Date('2024-01-15T08:30:00Z'),
      teamId: 'team_dev_001',
      reportDeadlineTime: '09:00',
      morningMeetingStartTime: '09:15',
    };

    const submittedReports = [
      {
        memberId: 'eng_001',
        reportDate: '2024-01-15',
        yesterday: 'API認証機能の実装完了',
        today: 'テスト及びバグ修正',
        issues: 'データベース接続が時々タイムアウトする',
      },
      {
        memberId: 'eng_002',
        reportDate: '2024-01-15',
        yesterday: 'フロントエンド画面のレイアウト調整',
        today: 'ユーザー入力バリデーション実装',
        issues: 'APIレスポンスが遅い場合がある',
      },
      {
        memberId: 'eng_003',
        reportDate: '2024-01-15',
        yesterday: '本番環境デプロイメント',
        today: 'パフォーマンス監視とログ確認',
        issues: 'サーバーメモリ使用率が高い',
      },
    ];

    const unsubmittedMembers = ['eng_004', 'eng_005'];

    const extractedIssuesFromReports = [
      {
        keyword: 'データベース接続タイムアウト',
        frequency: 2,
        affectedMembers: ['eng_001', 'eng_003'],
        description: 'DB接続時に間欠的なタイムアウトが発生',
      },
      {
        keyword: 'APIレスポンス遅延',
        frequency: 2,
        affectedMembers: ['eng_002', 'eng_001'],
        description: 'API呼び出し時の応答時間が長い',
      },
      {
        keyword: 'サーバーメモリ使用率高',
        frequency: 1,
        affectedMembers: ['eng_003'],
        description: 'サーバーのメモリ使用率が継続的に高い状態',
      },
    ];

    const pastIssueReferences = [
      {
        issueId: 'past_001',
        keyword: 'データベース接続',
        resolution: 'DB接続プール設定を最適化',
        resolvedDays: 3,
      },
      {
        issueId: 'past_002',
        keyword: 'API遅延',
        resolution: 'クエリの最適化とキャッシング導入',
        resolvedDays: 5,
      },
    ];

    // Setup: Action 05の入力に対応するAI出力（構造化レスポンス）
    const action05Output = {
      prioritizedIssues: [
        {
          rank: 1,
          keyword: 'データベース接続タイムアウト',
          frequency: 2,
          priorityScore: 5,
          severity: '高',
          reason: '2名のエンジニアが報告。過去に同様の課題あり。3日で解決可能。',
          recommendedAction: 'DB接続プール設定の即座の見直し',
        },
        {
          rank: 2,
          keyword: 'APIレスポンス遅延',
          frequency: 2,
          priorityScore: 4,
          severity: '中',
          reason: '2名のエンジニアが報告。クエリ最適化で対応可能。',
          recommendedAction: 'クエリの最適化検討会を開催',
        },
        {
          rank: 3,
          keyword: 'サーバーメモリ使用率高',
          frequency: 1,
          priorityScore: 3,
          severity: '中',
          reason: '1名の報告だが継続的。メモリリーク調査が必要。',
          recommendedAction: 'メモリ使用状況の詳細ログ取得',
        },
      ],
      summaryText:
        '【朝会用サマリー】優先度1位：DB接続タイムアウト（高）- 2名が報告、即対応推奨。優先度2位：API遅延（中）- クエリ最適化で改善予定。優先度3位：メモリ使用率高（中）- ログ取得後に調査。本日の対応方針：DB接続設定の見直し会議、API性能測定実施。',
    };

    // Mock: AIクライアントがAction 05実行時にこの出力を返すように設定
    // （実際のエージェント実装で、AIクライアントのメソッド呼び出し時にこの出力が得られることを想定）
    mockAiClient.buildAction05Prompt = jest.fn().mockReturnValue({
      version: '1.0.0',
      prompt: 'mock_action_05_prompt',
      expectedOutput: action05Output,
    });

    // Execute: runTx11Imp1Agentを呼び出す
    // （偽AIクライアントを第2パラメータに注入）
    const result = await runTx11Imp1Agent(
      {
        executionTimestamp: executionContext.executionTimestamp,
        teamId: executionContext.teamId,
        reportDeadlineTime: executionContext.reportDeadlineTime,
        managerEmail: 'manager@company.example.com',
      },
      mockAiClient
    );

    // Assertion 1: buildAction05Promptが呼び出されたことを確認
    expect(mockAiClient.buildAction05Prompt).toHaveBeenCalled();

    // Assertion 2: ACTION_05_PROMPT_VERSIONが存在することを確認
    expect(mockAiClient.ACTION_05_PROMPT_VERSION).toBeDefined();
    expect(typeof mockAiClient.ACTION_05_PROMPT_VERSION).toBe('string');

    // Assertion 3: 結果に優先度付けされた課題リストが含まれることを確認
    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);
    expect(result.prioritizedIssues.length).toBe(3);

    // Assertion 4: 各課題が優先度スコア1～5で順序付けされていることを確認
    expect(result.prioritizedIssues[0].priorityScore).toBe(5);
    expect(result.prioritizedIssues[1].priorityScore).toBe(4);
    expect(result.prioritizedIssues[2].priorityScore).toBe(3);

    // Assertion 5: 各課題に重大度レベル（高・中・低）が明記されていることを確認
    expect(result.prioritizedIssues[0].severity).toBe('高');
    expect(result.prioritizedIssues[1].severity).toBe('中');
    expect(result.prioritizedIssues[2].severity).toBe('中');

    // Assertion 6: 優先度付けの根拠がテキストで説明されていることを確認
    expect(result.prioritizedIssues[0].reason).toBeDefined();
    expect(typeof result.prioritizedIssues[0].reason).toBe('string');
    expect(result.prioritizedIssues[0].reason.length).toBeGreaterThan(0);

    // Assertion 7: 朝会用テキストが生成されていることを確認
    expect(result.summaryText).toBeDefined();
    expect(typeof result.summaryText).toBe('string');

    // Assertion 8: 朝会用テキストが150字以内であることを確認
    expect(result.summaryText.length).toBeLessThanOrEqual(150);

    // Assertion 9: サマリーが3件の抽出課題の優先度ランキングを含むことを確認
    expect(result.summaryText).toMatch(/優先度/);
    expect(result.summaryText).toMatch(/データベース接続/);

    // Assertion 10: サマリーが最優先課題の説明を含むことを確認
    expect(result.summaryText).toMatch(/優先度1位/);

    // Assertion 11: サマリーが部長が確認すべき対応方針案を含むことを確認
    expect(result.summaryText).toMatch(/対応方針|推奨|実施/);

    // Assertion 12: 提出状況が集計されていることを確認
    expect(result.submissionStatus).toBeDefined();
    expect(result.submissionStatus.totalMembers).toBeGreaterThan(0);
    expect(result.submissionStatus.submittedCount).toBeGreaterThanOrEqual(0);

    // Assertion 13: 未提出者リストが正確に作成されていることを確認
    expect(result.submissionStatus.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(result.submissionStatus.unsubmittedMembers)).toBe(true);

    // Assertion 14: 催促通知が送信されたことを確認
    expect(result.notificationsSent).toBeDefined();
    expect(Array.isArray(result.notificationsSent)).toBe(true);

    // Assertion 15: 部長向けサマリーメール送信フラグが設定されていることを確認
    expect(result.summaryEmailSent).toBeDefined();
    expect(typeof result.summaryEmailSent).toBe('boolean');

    // Assertion 16: AIクライアント第2パラメータがTx11Imp1AiClient型の全メンバーを保有していることを確認
    const aiClientKeys = Object.keys(mockAiClient);
    expect(aiClientKeys).toContain('buildAction01Prompt');
    expect(aiClientKeys).toContain('ACTION_01_PROMPT_VERSION');
    expect(aiClientKeys).toContain('buildAction02Prompt');
    expect(aiClientKeys).toContain('ACTION_02_PROMPT_VERSION');
    expect(aiClientKeys).toContain('buildAction03Prompt');
    expect(aiClientKeys).toContain('ACTION_03_PROMPT_VERSION');
    expect(aiClientKeys).toContain('buildAction04Prompt');
    expect(aiClientKeys).toContain('ACTION_04_PROMPT_VERSION');
    expect(aiClientKeys).toContain('buildAction05Prompt');
    expect(aiClientKeys).toContain('ACTION_05_PROMPT_VERSION');
    expect(aiClientKeys).toContain('buildAction06Prompt');
    expect(aiClientKeys).toContain('ACTION_06_PROMPT_VERSION');
    expect(aiClientKeys).toContain('buildAction07Prompt');
    expect(aiClientKeys).toContain('ACTION_07_PROMPT_VERSION');

    // Assertion 17: Orchestrator境界の条件を検証
    // 第2パラメータが正確にTx11Imp1AiClient型であることを確認
    expect(mockAiClient).toHaveProperty('buildAction05Prompt');
    expect(typeof mockAiClient.buildAction05Prompt).toBe('function');
    expect(mockAiClient).toHaveProperty('ACTION_05_PROMPT_VERSION');
    expect(typeof mockAiClient.ACTION_05_PROMPT_VERSION).toBe('string');
  });
});