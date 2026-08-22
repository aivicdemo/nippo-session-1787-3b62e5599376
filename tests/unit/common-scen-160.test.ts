import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-9-imp-1/prompts/action-01';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-9-imp-1/prompts/action-02';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-9-imp-1/prompts/action-03';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-9-imp-1/prompts/action-04';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-9-imp-1/prompts/action-05';
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from '../../src/agents/tx-9-imp-1/prompts/action-06';
import { buildAction07Prompt, ACTION_07_PROMPT_VERSION } from '../../src/agents/tx-9-imp-1/prompts/action-07';

describe('Tx9Imp1Agent - 日報集約から分析報告までの自動実行', () => {
  test('SCEN-160: 指定期間の朝会報告データを自動集約するAction1を契約どおり実行する', async () => {
    // Setup: テスト用コンテキストと期待値の定義
    const aggregationStartDate = '2024-12-01';
    const aggregationEndDate = '2024-12-15';
    const targetTeamIds: string[] = [];
    const requestedByUserId = 'user-001-director';
    const executionTimestampBefore = new Date('2024-12-15T09:00:00Z');
    const executionTimestampAfter = new Date('2024-12-15T10:00:00Z');

    const mockContext = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId,
      executionTimestamp: executionTimestampBefore,
    };

    // Mock日報データ: 10名分の3フィールド構造
    const mockMemberReportData = [
      {
        memberId: 'member-001',
        memberName: 'Alice',
        yesterday: 'APIエンドポイント実装完了',
        today: 'テストケース作成',
        issues: '認証ロジックの複雑性が高い',
      },
      {
        memberId: 'member-002',
        memberName: 'Bob',
        yesterday: 'DB設計レビュー',
        today: 'マイグレーション作成',
        issues: 'スキーマ変更による互換性問題',
      },
      {
        memberId: 'member-003',
        memberName: 'Carol',
        yesterday: 'フロントエンド UI実装',
        today: 'レスポンシブ対応',
        issues: 'ブラウザ互換性の問題',
      },
      {
        memberId: 'member-004',
        memberName: 'David',
        yesterday: 'デプロイメント自動化',
        today: 'CI/CDパイプライン調整',
        issues: 'ステージング環境の不安定性',
      },
      {
        memberId: 'member-005',
        memberName: 'Eve',
        yesterday: 'ドキュメント作成',
        today: 'APIリファレンス更新',
        issues: '手動ドキュメント管理の効率性',
      },
      {
        memberId: 'member-006',
        memberName: 'Frank',
        yesterday: 'パフォーマンス測定',
        today: '最適化実装',
        issues: 'クエリN+1問題',
      },
      {
        memberId: 'member-007',
        memberName: 'Grace',
        yesterday: 'セキュリティ監査',
        today: '脆弱性パッチ適用',
        issues: 'XSS対策の進捗遅延',
      },
      {
        memberId: 'member-008',
        memberName: 'Henry',
        yesterday: 'ユーザーテスト実施',
        today: 'フィードバック収集',
        issues: 'UXフィードバック件数が多い',
      },
      {
        memberId: 'member-009',
        memberName: 'Iris',
        yesterday: 'インフラ構築',
        today: 'クラウド環境設定',
        issues: 'コスト最適化の検討が必要',
      },
      {
        memberId: 'member-010',
        memberName: 'Jack',
        yesterday: 'チーム会議実施',
        today: 'アクションアイテム追跡',
        issues: '優先度判定が曖昧なタスク',
      },
    ];

    // Mock AI Client: Action1のプロンプト生成と応答を模擬
    let action01PromptCalled = false;
    let action01PromptContent = '';
    let action02PromptCalled = false;
    let action03PromptCalled = false;
    let action04PromptCalled = false;
    let action05PromptCalled = false;
    let action06PromptCalled = false;
    let action07PromptCalled = false;

    const mockAiClient = {
      buildPromptAndCallModel: async (
        promptBuilder: (args: any) => string,
        promptVersion: string,
        args: any
      ) => {
        // Action 1: 指定期間の朝会報告データを自動集約する
        if (promptVersion === ACTION_01_PROMPT_VERSION) {
          action01PromptCalled = true;
          action01PromptContent = promptBuilder(args);

          // プロンプトに指定期間パラメータが含まれていることを確認
          expect(action01PromptContent).toContain(aggregationStartDate);
          expect(action01PromptContent).toContain(aggregationEndDate);

          return {
            status: 'completed',
            aggregatedData: mockMemberReportData,
            periodStart: aggregationStartDate,
            periodEnd: aggregationEndDate,
            memberCount: 10,
            fieldCount: 3,
            executionTimestamp: new Date('2024-12-15T09:30:00Z').toISOString(),
            dataQualityValid: true,
          };
        }

        // Action 2: 未提出メンバーを特定し催促通知を送信する
        if (promptVersion === ACTION_02_PROMPT_VERSION) {
          action02PromptCalled = true;
          return {
            status: 'completed',
            unsubmittedMembers: [],
            reminders_sent: 0,
          };
        }

        // Action 3: 生産性指標を定量化する
        if (promptVersion === ACTION_03_PROMPT_VERSION) {
          action03PromptCalled = true;
          return {
            status: 'completed',
            metrics: {
              average_issue_count: 1.0,
              average_resolution_days: 2.5,
              submission_rate: 100,
            },
          };
        }

        // Action 4: 課題を優先度別に分類・分析する
        if (promptVersion === ACTION_04_PROMPT_VERSION) {
          action04PromptCalled = true;
          return {
            status: 'completed',
            classified_issues: [
              {
                priority: 'high',
                category: 'Technical',
                count: 3,
              },
              {
                priority: 'medium',
                category: 'Process',
                count: 5,
              },
              {
                priority: 'low',
                category: 'Infrastructure',
                count: 2,
              },
            ],
          };
        }

        // Action 5: 同一課題の再発パターンを検出する
        if (promptVersion === ACTION_05_PROMPT_VERSION) {
          action05PromptCalled = true;
          return {
            status: 'completed',
            recurrence_patterns: [
              {
                pattern_id: 'pattern-001',
                description: 'Authentication complexity recurrence',
                occurrences: 2,
              },
            ],
          };
        }

        // Action 6: 改善施策を提案する
        if (promptVersion === ACTION_06_PROMPT_VERSION) {
          action06PromptCalled = true;
          return {
            status: 'completed',
            recommendations: [
              {
                issue_id: 'issue-001',
                recommendation: 'Implement centralized auth service',
                priority: 'high',
              },
            ],
          };
        }

        // Action 7: 分析結果と施策をまとめた報告書を作成し部長に提示する
        if (promptVersion === ACTION_07_PROMPT_VERSION) {
          action07PromptCalled = true;
          return {
            status: 'completed',
            report_id: 'report-20241215-001',
            summary: 'Weekly analysis report generated successfully',
            recommendations_count: 1,
            critical_issues: 0,
          };
        }

        throw new Error(`Unknown prompt version: ${promptVersion}`);
      },
    };

    // Execute: runTx9Imp1Agent を呼び出し
    const result = await runTx9Imp1Agent(mockContext, mockAiClient as any);

    // Assert: Action1が正しく実行されたことを確認
    expect(action01PromptCalled).toBe(true);
    expect(action01PromptContent.length).toBeGreaterThan(0);

    // Assert: 集約されたデータが正しい構造であることを確認
    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
    expect(result.aggregatedData).toBeDefined();
    expect(Array.isArray(result.aggregatedData)).toBe(true);
    expect(result.aggregatedData.length).toBe(10);

    // Assert: 各データレコードに3フィールドすべてが含まれていることを確認
    result.aggregatedData.forEach((record: any) => {
      expect(record).toHaveProperty('yesterday');
      expect(record).toHaveProperty('today');
      expect(record).toHaveProperty('issues');
      expect(typeof record.yesterday).toBe('string');
      expect(typeof record.today).toBe('string');
      expect(typeof record.issues).toBe('string');
    });

    // Assert: 指定期間が正しく記録されていることを確認
    expect(result.periodStart).toBe(aggregationStartDate);
    expect(result.periodEnd).toBe(aggregationEndDate);
    expect(result.memberCount).toBe(10);
    expect(result.fieldCount).toBe(3);

    // Assert: 実行時刻タイムスタンプが記録されていることを確認
    expect(result.executionTimestamp).toBeDefined();
    const executionTime = new Date(result.executionTimestamp);
    expect(executionTime.getTime()).toBeGreaterThanOrEqual(executionTimestampBefore.getTime());
    expect(executionTime.getTime()).toBeLessThanOrEqual(executionTimestampAfter.getTime());

    // Assert: データ品質検証フラグが付与されていることを確認
    expect(result.dataQualityValid).toBe(true);

    // Assert: すべてのアクションが実行され、適切なシーケンスで進行したことを確認
    expect(action02PromptCalled).toBe(true);
    expect(action03PromptCalled).toBe(true);
    expect(action04PromptCalled).toBe(true);
    expect(action05PromptCalled).toBe(true);
    expect(action06PromptCalled).toBe(true);
    expect(action07PromptCalled).toBe(true);
  });
});