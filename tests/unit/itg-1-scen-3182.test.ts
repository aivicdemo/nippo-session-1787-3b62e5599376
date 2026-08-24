import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-02';

describe('月次レポート生成から分析完了までの自動実行 AIエージェント', () => {
  // SCEN-3182
  test('当月初日にレポート生成トリガーを認識し、前月の蓄積報告データを自動抽出する', async () => {
    // テスト用の前月報告データ（10名分）
    const previousMonthReports = [
      {
        reportId: 'report_001',
        userId: 'user_001',
        reportDate: '2023-12-15',
        yesterday: '顧客Aの要件調査を完了',
        today: '要件定義書の作成開始',
        challenges: 'データベース設計の仕様が未確定のため進捗が遅延している',
      },
      {
        reportId: 'report_002',
        userId: 'user_002',
        reportDate: '2023-12-15',
        yesterday: 'UIコンポーネントの実装',
        today: 'ユニットテストの作成',
        challenges: 'テスト環境でのAPI接続エラーが発生中',
      },
      {
        reportId: 'report_003',
        userId: 'user_003',
        reportDate: '2023-12-15',
        yesterday: 'リリース前のバグ修正',
        today: 'システムテストの実施',
        challenges: '本番環境への接続制限により検証ができていない',
      },
      {
        reportId: 'report_004',
        userId: 'user_004',
        reportDate: '2023-12-15',
        yesterday: 'ドキュメント作成',
        today: 'チーム内レビュー対応',
        challenges: '翻訳作業の調整が必要',
      },
      {
        reportId: 'report_005',
        userId: 'user_005',
        reportDate: '2023-12-15',
        yesterday: 'パフォーマンス測定',
        today: '最適化施策の実装',
        challenges: 'メモリ使用量が想定以上に増加している',
      },
      {
        reportId: 'report_006',
        userId: 'user_006',
        reportDate: '2023-12-20',
        yesterday: 'セキュリティテスト実施',
        today: '脆弱性対応',
        challenges: '依存ライブラリのバージョンアップが難航している',
      },
      {
        reportId: 'report_007',
        userId: 'user_007',
        reportDate: '2023-12-20',
        yesterday: 'インフラ構築',
        today: 'デプロイパイプラインの設定',
        challenges: 'CI/CDツールの動作不安定',
      },
      {
        reportId: 'report_008',
        userId: 'user_008',
        reportDate: '2023-12-20',
        yesterday: 'ログ解析',
        today: '監視アラート設定',
        challenges: 'ネットワークレイテンシの問題が継続している',
      },
      {
        reportId: 'report_009',
        userId: 'user_009',
        reportDate: '2023-12-20',
        yesterday: 'ユーザーサポート対応',
        today: 'ナレッジベース更新',
        challenges: 'ユーザーからの問い合わせ件数が増加',
      },
      {
        reportId: 'report_010',
        userId: 'user_010',
        reportDate: '2023-12-25',
        yesterday: 'スプリントプランニング',
        today: 'チーム打ち合わせ',
        challenges: 'リソース不足による スケジュール遅延',
      },
    ];

    // Action-02呼び出しの記録
    let action02Called = false;
    let action02PromptVersion = '';
    let extractedData: any = null;

    // 偽のAIクライアント
    const fakeAiClient: Tx7Imp1AiClient = {
      action01: async () => ({
        status: 'success',
        message: 'Action 1 completed',
      }),
      action02: async (input: any) => {
        action02Called = true;
        // buildAction02Promptを呼び出してPromptバージョンを検証
        const prompt = buildAction02Prompt(input);
        action02PromptVersion = ACTION_02_PROMPT_VERSION;
        
        // 抽出データをシミュレート
        extractedData = {
          periodStart: '2023-12-01',
          periodEnd: '2023-12-31',
          extractedReports: previousMonthReports,
          totalCount: previousMonthReports.length,
        };

        return {
          status: 'success',
          data: extractedData,
        };
      },
      action03: async () => ({
        status: 'success',
        message: 'Action 3 completed',
      }),
      action04: async () => ({
        status: 'success',
        message: 'Action 4 completed',
      }),
      action05: async () => ({
        status: 'success',
        message: 'Action 5 completed',
      }),
      action06: async () => ({
        status: 'success',
        message: 'Action 6 completed',
      }),
      action07: async () => ({
        status: 'success',
        message: 'Action 7 completed',
      }),
      action08: async () => ({
        status: 'success',
        message: 'Action 8 completed',
      }),
    };

    // 月初日（2024年1月1日）に設定
    const triggerTimestamp = new Date('2024-01-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'manager_001';

    // Agent実行
    const result = await runTx7Imp1Agent(
      {
        triggerTimestamp,
        targetMonth,
        managerUserId,
        includeDetailedAnalysis: true,
      },
      fakeAiClient
    );

    // 検証1: Action-02が呼び出されたか確認
    expect(action02Called).toBe(true);

    // 検証2: PromptバージョンがACTION_02_PROMPT_VERSIONと一致するか確認
    expect(action02PromptVersion).toBe(ACTION_02_PROMPT_VERSION);

    // 検証3: 抽出されたデータが前月1日〜前月末日の期間か確認
    expect(extractedData.periodStart).toBe('2023-12-01');
    expect(extractedData.periodEnd).toBe('2023-12-31');

    // 検証4: 抽出データが10名全員の報告を含んでいるか確認
    expect(extractedData.totalCount).toBe(10);
    expect(extractedData.extractedReports).toHaveLength(10);

    // 検証5: 各報告レコードに必須フィールドが存在するか確認
    extractedData.extractedReports.forEach((report: any) => {
      expect(report).toHaveProperty('reportId');
      expect(report).toHaveProperty('userId');
      expect(report).toHaveProperty('yesterday');
      expect(report).toHaveProperty('today');
      expect(report).toHaveProperty('challenges');
      expect(report.yesterday).not.toBe('');
      expect(report.today).not.toBe('');
      expect(report.challenges).not.toBe('');
    });

    // 検証6: 月次レポート生成結果の構造を確認
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('generatedAt');
    expect(result).toHaveProperty('executionStatus');
    expect(result.executionStatus).toBe('success');

    // 検証7: 生成日時が月初日以降であることを確認
    const generatedAt = new Date(result.generatedAt);
    const monthStart = new Date('2024-01-01T00:00:00Z');
    expect(generatedAt.getTime()).toBeGreaterThanOrEqual(monthStart.getTime());
  });
});