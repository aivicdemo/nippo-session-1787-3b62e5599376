import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type {
  Tx6AgentInput,
  Tx6AgentOutput,
  PriorityIssue,
} from '../../src/agents/tx-6-imp-1/orchestrator';

describe('Tx6Imp1Agent - 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-3169
  test('should execute all 7 autonomous actions in order and deliver analysis report to manager and stakeholders with issue keywords, occurrence frequency, trend analysis, and priority scores', async () => {
    // Setup: フェイクAIクライアントの作成
    const mockAiClient = {
      buildAction01Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 1 prompt',
        version: 'v1.0',
      }),
      buildAction02Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 2 prompt',
        version: 'v1.0',
      }),
      buildAction03Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 3 prompt',
        version: 'v1.0',
      }),
      buildAction04Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 4 prompt',
        version: 'v1.0',
      }),
      buildAction05Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 5 prompt',
        version: 'v1.0',
      }),
      buildAction06Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 6 prompt',
        version: 'v1.0',
      }),
      buildAction07Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 7 prompt',
        version: 'v1.0',
      }),
    };

    // Setup: フェイクNotificationServiceAdapterの作成
    const mockNotificationAdapter = {
      sendReportToManagerAndStakeholders: jest
        .fn()
        .mockResolvedValue({
          notificationId: 'notif-001',
          status: 'delivered',
          timestamp: new Date('2024-01-15T09:15:00Z'),
        }),
    };

    // Setup: 前週の日報データ（10名分）を準備
    const executionTimestamp = new Date('2024-01-15T09:00:00Z'); // 月曜朝9時
    const analysisStartDate = '2024-01-08'; // 前週月曜
    const analysisEndDate = '2024-01-14'; // 前週日曜
    const teamId = 'team-dev-001';

    // 前週の日報データをシステムに事前登録（モック）
    const reportDataCollection = [
      {
        memberId: 'eng-001',
        submittedAt: new Date('2024-01-08T08:50:00Z'),
        yesterday: 'APIエンドポイント実装を完了',
        today: 'テスト仕様書作成、レビュー対応',
        issue: 'データベース接続タイムアウトの問題が発生',
      },
      {
        memberId: 'eng-002',
        submittedAt: new Date('2024-01-09T08:45:00Z'),
        yesterday: 'ユーザー認証機能のテスト',
        today: 'パフォーマンス改善作業',
        issue: 'セッション管理の設計が曖昧で時間がかかっている',
      },
      {
        memberId: 'eng-003',
        submittedAt: new Date('2024-01-10T08:55:00Z'),
        yesterday: 'フロントエンドコンポーネント作成',
        today: 'バックエンド連携確認',
        issue: 'データベース接続タイムアウトで動作検証ができない',
      },
      {
        memberId: 'eng-004',
        submittedAt: new Date('2024-01-11T08:50:00Z'),
        yesterday: 'CI/CDパイプライン構築',
        today: 'デプロイ自動化設定',
        issue: 'セッション管理ライブラリのバージョン互換性問題',
      },
      {
        memberId: 'eng-005',
        submittedAt: new Date('2024-01-12T08:45:00Z'),
        yesterday: 'ドキュメント整備',
        today: '構成管理マニュアル作成',
        issue: 'データベース接続タイムアウトが再発',
      },
      {
        memberId: 'eng-006',
        submittedAt: new Date('2024-01-08T08:50:00Z'),
        yesterday: 'セキュリティ監査実施',
        today: '脆弱性対応',
        issue: 'セッション管理の設計見直しが必要',
      },
      {
        memberId: 'eng-007',
        submittedAt: new Date('2024-01-09T08:55:00Z'),
        yesterday: '要件定義会議',
        today: 'システムアーキテクチャ検証',
        issue: 'API仕様の曖昧さにより実装遅延',
      },
      {
        memberId: 'eng-008',
        submittedAt: new Date('2024-01-10T08:50:00Z'),
        yesterday: '外部API連携テスト',
        today: 'レスポンスハンドリング改善',
        issue: 'データベース接続タイムアウトの根本原因が不明',
      },
      {
        memberId: 'eng-009',
        submittedAt: new Date('2024-01-11T08:45:00Z'),
        yesterday: 'パフォーマンス測定',
        today: 'キャッシング戦略検討',
        issue: 'セッション情報の永続化方法が未決定',
      },
      {
        memberId: 'eng-010',
        submittedAt: new Date('2024-01-12T08:50:00Z'),
        yesterday: 'ユーザー反応調査',
        today: 'UX改善施策実行',
        issue: 'データベース接続タイムアウトの継続的な発生',
      },
    ];

    // 入力データの準備
    const input: Tx6AgentInput = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    // Action1-7の実行を段階的に検証するためのスパイ
    const actionExecutionOrder: string[] = [];

    // モック実装をワップして実行順序を追跡
    const wrappedAiClient = {
      buildAction01Prompt: jest
        .fn()
        .mockImplementation(async () => {
          actionExecutionOrder.push('Action01');
          return { prompt: 'Collect reports', version: 'v1.0' };
        }),
      buildAction02Prompt: jest
        .fn()
        .mockImplementation(async () => {
          actionExecutionOrder.push('Action02');
          return { prompt: 'Identify non-submitted', version: 'v1.0' };
        }),
      buildAction03Prompt: jest
        .fn()
        .mockImplementation(async () => {
          actionExecutionOrder.push('Action03');
          return { prompt: 'Extract issues', version: 'v1.0' };
        }),
      buildAction04Prompt: jest
        .fn()
        .mockImplementation(async () => {
          actionExecutionOrder.push('Action04');
          return { prompt: 'Analyze trends', version: 'v1.0' };
        }),
      buildAction05Prompt: jest
        .fn()
        .mockImplementation(async () => {
          actionExecutionOrder.push('Action05');
          return { prompt: 'Priority scoring', version: 'v1.0' };
        }),
      buildAction06Prompt: jest
        .fn()
        .mockImplementation(async () => {
          actionExecutionOrder.push('Action06');
          return { prompt: 'Generate report', version: 'v1.0' };
        }),
      buildAction07Prompt: jest
        .fn()
        .mockImplementation(async () => {
          actionExecutionOrder.push('Action07');
          return { prompt: 'Deliver report', version: 'v1.0' };
        }),
    };

    // エージェント実行
    const result = await runTx6Imp1Agent(input, wrappedAiClient as any);

    // Assertion 1: すべてのアクションが順序通り実行されたことを確認
    expect(actionExecutionOrder).toEqual([
      'Action01',
      'Action02',
      'Action03',
      'Action04',
      'Action05',
      'Action06',
      'Action07',
    ]);

    // Assertion 2: すべてのプロンプト生成関数が呼び出されたことを確認
    expect(wrappedAiClient.buildAction01Prompt).toHaveBeenCalled();
    expect(wrappedAiClient.buildAction02Prompt).toHaveBeenCalled();
    expect(wrappedAiClient.buildAction03Prompt).toHaveBeenCalled();
    expect(wrappedAiClient.buildAction04Prompt).toHaveBeenCalled();
    expect(wrappedAiClient.buildAction05Prompt).toHaveBeenCalled();
    expect(wrappedAiClient.buildAction06Prompt).toHaveBeenCalled();
    expect(wrappedAiClient.buildAction07Prompt).toHaveBeenCalled();

    // Assertion 3: エージェント実行結果の構造を検証
    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('success');
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportGeneratedAt).toBeInstanceOf(Date);
    expect(result.emailSentAt).toBeInstanceOf(Date);

    // Assertion 4: 抽出課題数の検証（10名の日報から5種類のキーワードを抽出）
    // 期待値: 「データベース接続タイムアウト」4件、「セッション管理」4件、「API仕様」1件
    expect(result.extractedIssueCount).toBe(5);

    // Assertion 5: 優先度上位5件の課題リストを検証
    expect(result.topPriorityIssues).toBeDefined();
    expect(Array.isArray(result.topPriorityIssues)).toBe(true);
    expect(result.topPriorityIssues.length).toBeLessThanOrEqual(5);

    // Assertion 6: 優先度スコア1位の課題を検証（発生頻度最高のもの）
    const topIssue = result.topPriorityIssues[0];
    expect(topIssue.issueKeyword).toBe('データベース接続タイムアウト');
    expect(topIssue.occurrenceCount).toBe(4); // 4名が報告
    expect(typeof topIssue.priorityScore).toBe('number');
    expect(topIssue.priorityScore).toBeGreaterThanOrEqual(0);
    expect(topIssue.priorityScore).toBeLessThanOrEqual(100);
    expect(topIssue.priorityRank).toBe('高');

    // Assertion 7: 優先度スコア2位の課題を検証
    const secondIssue = result.topPriorityIssues[1];
    expect(secondIssue.issueKeyword).toBe('セッション管理');
    expect(secondIssue.occurrenceCount).toBe(4); // 4名が報告
    expect(secondIssue.priorityScore).toBeLessThanOrEqual(topIssue.priorityScore);
    expect(secondIssue.priorityRank).toBe('高');

    // Assertion 8: 優先度スコアが発生頻度順にソートされていることを確認
    for (let i = 0; i < result.topPriorityIssues.length - 1; i++) {
      expect(
        result.topPriorityIssues[i].priorityScore
      ).toBeGreaterThanOrEqual(result.topPriorityIssues[i + 1].priorityScore);
    }

    // Assertion 9: すべての優先度スコアが有効な範囲内にあることを確認
    result.topPriorityIssues.forEach((issue: PriorityIssue) => {
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
    });

    // Assertion 10: 優先度ランクが正しく設定されていることを確認
    result.topPriorityIssues.forEach((issue: PriorityIssue) => {
      expect(['高', '中', '低']).toContain(issue.priorityRank);
    });

    // Assertion 11: 各プロンプト生成関数が正確に1回呼び出されたことを確認
    expect(wrappedAiClient.buildAction01Prompt).toHaveBeenCalledTimes(1);
    expect(wrappedAiClient.buildAction02Prompt).toHaveBeenCalledTimes(1);
    expect(wrappedAiClient.buildAction03Prompt).toHaveBeenCalledTimes(1);
    expect(wrappedAiClient.buildAction04Prompt).toHaveBeenCalledTimes(1);
    expect(wrappedAiClient.buildAction05Prompt).toHaveBeenCalledTimes(1);
    expect(wrappedAiClient.buildAction06Prompt).toHaveBeenCalledTimes(1);
    expect(wrappedAiClient.buildAction07Prompt).toHaveBeenCalledTimes(1);

    // Assertion 12: レポート生成日時が実行時刻以降であることを確認
    expect(result.reportGeneratedAt.getTime()).toBeGreaterThanOrEqual(
      executionTimestamp.getTime()
    );

    // Assertion 13: メール送信日時がレポート生成後であることを確認
    expect(result.emailSentAt.getTime()).toBeGreaterThanOrEqual(
      result.reportGeneratedAt.getTime()
    );

    // Assertion 14: 分析期間の検証
    expect(result.analysisPeriod).toBeDefined();
    expect(result.analysisPeriod.startDate).toBe(analysisStartDate);
    expect(result.analysisPeriod.endDate).toBe(analysisEndDate);

    // Assertion 15: レポート配信対象が含まれていることを確認
    expect(result.recipientInfo).toBeDefined();
    expect(result.recipientInfo.managers).toBeDefined();
    expect(Array.isArray(result.recipientInfo.managers)).toBe(true);
    expect(result.recipientInfo.managers.length).toBeGreaterThan(0);

    // Assertion 16: 監査ログにAction07プロンプトが記録されていることを確認
    expect(result.auditLog).toBeDefined();
    expect(Array.isArray(result.auditLog)).toBe(true);
    const action07Log = result.auditLog.find(
      (log: any) => log.actionName === 'Action07'
    );
    expect(action07Log).toBeDefined();
    expect(action07Log.promptVersion).toBe('v1.0');
    expect(action07Log.status).toBe('completed');
  });
});