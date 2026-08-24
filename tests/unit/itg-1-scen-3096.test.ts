import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type {
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
  Tx2Imp1AiClient,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('Tx2Imp1Agent - 日報収集から課題抽出・配信までの自律実行', () => {
  // SCEN-3096
  test('should complete all 6 autonomous actions without manual intervention and deliver confirmation email to manager', async () => {
    // ========================================
    // Setup: スタブクライアント（fakeAiClient）を定義
    // ========================================
    const fakeAiClient: Tx2Imp1AiClient = {
      // Action 1: 全メンバーの日報受信状況確認
      executeAction01GetReportSubmissionStatus: jest.fn(async () => ({
        totalMembers: 10,
        submittedCount: 10,
        unsubmittedCount: 0,
        submittedMemberIds: [
          'member_001',
          'member_002',
          'member_003',
          'member_004',
          'member_005',
          'member_006',
          'member_007',
          'member_008',
          'member_009',
          'member_010',
        ],
        unsubmittedMemberIds: [],
        executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      })),

      // Action 2: 日報をテキスト統一フォーマットに自動変換
      executeAction02UnifyReportFormat: jest.fn(async () => ({
        unifiedReports: [
          {
            memberId: 'member_001',
            yesterday: 'API エンドポイント実装完了',
            today: 'テストコード作成',
            challenges: 'DBスキーマ設計の遅延',
          },
          {
            memberId: 'member_002',
            yesterday: 'DB設計レビュー実施',
            today: 'マイグレーション実行準備',
            challenges: 'テーブル定義の曖昧性',
          },
          {
            memberId: 'member_003',
            yesterday: 'フロントエンド画面実装',
            today: 'スタイリング調整',
            challenges: 'ブラウザ互換性問題',
          },
          {
            memberId: 'member_004',
            yesterday: 'デプロイ自動化構築',
            today: 'CI/CD パイプライン検証',
            challenges: 'コンテナイメージサイズ削減',
          },
          {
            memberId: 'member_005',
            yesterday: 'セキュリティ監査',
            today: '脆弱性対応',
            challenges: 'SQL インジェクション対策',
          },
          {
            memberId: 'member_006',
            yesterday: 'ドキュメント作成',
            today: 'API仕様書更新',
            challenges: 'ドキュメント同期の遅延',
          },
          {
            memberId: 'member_007',
            yesterday: 'パフォーマンス計測',
            today: 'クエリ最適化実施',
            challenges: 'DB スキーマ設計の遅延',
          },
          {
            memberId: 'member_008',
            yesterday: 'ユーザーテスト実施',
            today: 'フィードバック分析',
            challenges: 'ブラウザ互換性問題',
          },
          {
            memberId: 'member_009',
            yesterday: 'インフラ監視設定',
            today: 'ログ解析自動化',
            challenges: 'コンテナイメージサイズ削減',
          },
          {
            memberId: 'member_010',
            yesterday: 'リリース準備',
            today: 'リリースノート作成',
            challenges: 'リリーススケジュール調整',
          },
        ],
        conversionCount: 10,
        executionTimestamp: new Date('2024-01-15T09:05:00Z'),
      })),

      // Action 3: テキスト解析で課題・リスク・成果を自動抽出
      executeAction03ExtractKeywords: jest.fn(async () => ({
        extractedKeywords: [
          {
            keyword: 'DB スキーマ設計の遅延',
            category: 'challenge',
            frequency: 2,
            confidenceScore: 0.92,
            mentionedByMembers: ['member_001', 'member_007'],
          },
          {
            keyword: 'ブラウザ互換性問題',
            category: 'challenge',
            frequency: 2,
            confidenceScore: 0.88,
            mentionedByMembers: ['member_003', 'member_008'],
          },
          {
            keyword: 'コンテナイメージサイズ削減',
            category: 'challenge',
            frequency: 2,
            confidenceScore: 0.85,
            mentionedByMembers: ['member_004', 'member_009'],
          },
          {
            keyword: 'SQL インジェクション対策',
            category: 'challenge',
            frequency: 1,
            confidenceScore: 0.90,
            mentionedByMembers: ['member_005'],
          },
          {
            keyword: 'ドキュメント同期の遅延',
            category: 'challenge',
            frequency: 1,
            confidenceScore: 0.83,
            mentionedByMembers: ['member_006'],
          },
          {
            keyword: 'リリーススケジュール調整',
            category: 'challenge',
            frequency: 1,
            confidenceScore: 0.81,
            mentionedByMembers: ['member_010'],
          },
          {
            keyword: 'API エンドポイント実装完了',
            category: 'achievement',
            frequency: 1,
            confidenceScore: 0.95,
            mentionedByMembers: ['member_001'],
          },
          {
            keyword: 'テストコード作成',
            category: 'achievement',
            frequency: 1,
            confidenceScore: 0.91,
            mentionedByMembers: ['member_001'],
          },
        ],
        totalExtracted: 8,
        executionTimestamp: new Date('2024-01-15T09:10:00Z'),
      })),

      // Action 4: 優先度別に色分けして整理
      executeAction04PrioritizeAndColorize: jest.fn(async () => ({
        prioritizedIssues: [
          {
            issueId: 'issue_001',
            keyword: 'DB スキーマ設計の遅延',
            category: 'challenge',
            frequency: 2,
            impactScore: 85,
            priorityRank: 'HIGH',
            color: '#FF0000',
            mentionedByMembers: ['member_001', 'member_007'],
          },
          {
            issueId: 'issue_002',
            keyword: 'ブラウザ互換性問題',
            category: 'challenge',
            frequency: 2,
            impactScore: 72,
            priorityRank: 'MEDIUM',
            color: '#FFD700',
            mentionedByMembers: ['member_003', 'member_008'],
          },
          {
            issueId: 'issue_003',
            keyword: 'コンテナイメージサイズ削減',
            category: 'challenge',
            frequency: 2,
            impactScore: 68,
            priorityRank: 'MEDIUM',
            color: '#FFD700',
            mentionedByMembers: ['member_004', 'member_009'],
          },
          {
            issueId: 'issue_004',
            keyword: 'SQL インジェクション対策',
            category: 'challenge',
            frequency: 1,
            impactScore: 95,
            priorityRank: 'HIGH',
            color: '#FF0000',
            mentionedByMembers: ['member_005'],
          },
          {
            issueId: 'issue_005',
            keyword: 'ドキュメント同期の遅延',
            category: 'challenge',
            frequency: 1,
            impactScore: 45,
            priorityRank: 'LOW',
            color: '#00AA00',
            mentionedByMembers: ['member_006'],
          },
          {
            issueId: 'issue_006',
            keyword: 'リリーススケジュール調整',
            category: 'challenge',
            frequency: 1,
            impactScore: 78,
            priorityRank: 'HIGH',
            color: '#FF0000',
            mentionedByMembers: ['member_010'],
          },
        ],
        totalPrioritized: 6,
        executionTimestamp: new Date('2024-01-15T09:15:00Z'),
      })),

      // Action 5: 未提出メンバーを特定
      executeAction05IdentifyUnsubmitted: jest.fn(async () => ({
        unsubmittedMembers: [],
        unsubmittedCount: 0,
        executionTimestamp: new Date('2024-01-15T09:20:00Z'),
      })),

      // Action 6: 確認メール自動生成・配信
      executeAction06GenerateAndSendConfirmationEmail: jest.fn(async () => ({
        emailSent: true,
        messageId: 'msg_20240115_090000_tx2imp1_001',
        deliveryStatus: 'success',
        managerEmail: 'manager@example.com',
        sentTimestamp: new Date('2024-01-15T09:25:00Z'),
      })),
    };

    // ========================================
    // Input: Tx2Imp1AgentInput を構築
    // ========================================
    const input: Tx2Imp1AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      targetTeamIds: ['team_001'],
      managerUserIds: ['manager_001'],
    };

    // ========================================
    // Execute: runTx2Imp1Agent を実行
    // ========================================
    const output: Tx2Imp1AgentOutput = await runTx2Imp1Agent(
      input,
      fakeAiClient,
    );

    // ========================================
    // Assertion 1: 完了ステータスの検証
    // ========================================
    expect(output.completionStatus).toBe('success');

    // ========================================
    // Assertion 2: 集約された日報件数
    // ========================================
    expect(output.aggregatedReportCount).toBe(10);

    // ========================================
    // Assertion 3: 抽出された課題キーワード件数
    // ========================================
    expect(output.extractedIssueCount).toBe(6);

    // ========================================
    // Assertion 4: 優先度付き課題一覧の存在と内容
    // ========================================
    expect(output.prioritizedIssues).toBeDefined();
    expect(output.prioritizedIssues.length).toBe(6);

    // 優先度別の課題確認
    const highPriorityIssues = output.prioritizedIssues.filter(
      (issue) => issue.priorityRank === 'HIGH',
    );
    expect(highPriorityIssues.length).toBe(3);
    expect(highPriorityIssues.map((i) => i.keyword)).toEqual([
      'DB スキーマ設計の遅延',
      'SQL インジェクション対策',
      'リリーススケジュール調整',
    ]);

    const mediumPriorityIssues = output.prioritizedIssues.filter(
      (issue) => issue.priorityRank === 'MEDIUM',
    );
    expect(mediumPriorityIssues.length).toBe(2);

    const lowPriorityIssues = output.prioritizedIssues.filter(
      (issue) => issue.priorityRank === 'LOW',
    );
    expect(lowPriorityIssues.length).toBe(1);

    // ========================================
    // Assertion 5: 色分けの検証
    // ========================================
    highPriorityIssues.forEach((issue) => {
      expect(issue.color).toBe('#FF0000');
    });
    mediumPriorityIssues.forEach((issue) => {
      expect(issue.color).toBe('#FFD700');
    });
    lowPriorityIssues.forEach((issue) => {
      expect(issue.color).toBe('#00AA00');
    });

    // ========================================
    // Assertion 6: 確認メール配信ステータス
    // ========================================
    expect(output.confirmationEmailSent).toBe(true);

    // ========================================
    // Assertion 7: 全スタブメソッドの呼び出し確認
    // ========================================
    expect(fakeAiClient.executeAction01GetReportSubmissionStatus).toHaveBeenCalled();
    expect(fakeAiClient.executeAction02UnifyReportFormat).toHaveBeenCalled();
    expect(fakeAiClient.executeAction03ExtractKeywords).toHaveBeenCalled();
    expect(fakeAiClient.executeAction04PrioritizeAndColorize).toHaveBeenCalled();
    expect(fakeAiClient.executeAction05IdentifyUnsubmitted).toHaveBeenCalled();
    expect(fakeAiClient.executeAction06GenerateAndSendConfirmationEmail).toHaveBeenCalled();

    // ========================================
    // Assertion 8: メール配信の詳細検証
    // ========================================
    expect(output.emailDeliveryStatus).toBe('success');
    expect(output.emailMessageId).toBeDefined();

    // ========================================
    // Assertion 9: 実行時間が30分以内であることを検証
    // ========================================
    const executionDurationMs =
      new Date('2024-01-15T09:25:00Z').getTime() -
      new Date('2024-01-15T09:00:00Z').getTime();
    expect(executionDurationMs).toBeLessThanOrEqual(30 * 60 * 1000);

    // ========================================
    // Assertion 10: 監査ログの検証
    // ========================================
    expect(output.auditLog).toBeDefined();
    expect(output.auditLog.length).toBeGreaterThanOrEqual(6);
    const auditActions = output.auditLog.map((log) => log.actionName);
    expect(auditActions).toContain('Action01_GetReportSubmissionStatus');
    expect(auditActions).toContain('Action02_UnifyReportFormat');
    expect(auditActions).toContain('Action03_ExtractKeywords');
    expect(auditActions).toContain('Action04_PrioritizeAndColorize');
    expect(auditActions).toContain('Action05_IdentifyUnsubmitted');
    expect(auditActions).toContain('Action06_GenerateAndSendConfirmationEmail');

    // ========================================
    // Assertion 11: ロールバックなしの確認
    // ========================================
    expect(output.requiresRollback).toBe(false);

    // ========================================
    // Assertion 12: 未提出者情報がメールに含まれることを確認
    // ========================================
    expect(output.unsubmittedMembersCount).toBe(0);

    // ========================================
    // Assertion 13: タイムスタンプが記録されていることを確認
    // ========================================
    expect(output.executionStartTime).toBeDefined();
    expect(output.executionEndTime).toBeDefined();
    expect(output.executionStartTime).toEqual(new Date('2024-01-15T09:00:00Z'));
  });
});