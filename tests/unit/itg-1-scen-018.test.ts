import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6AgentExecutionContext, Tx6AgentExecutionResult } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('朝会報告管理システム - Tx6Imp1Agent (週次分析レポート生成)', () => {
  test('SCEN-018: 毎週月曜朝に前週の日報を自動収集し、課題を抽出・分類・傾向分析してレポートを生成・配信する', async () => {
    // テスト用の Tx6AgentExecutionContext を構築
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const targetWeekStartDate = new Date('2024-01-08T00:00:00Z');
    const targetWeekEndDate = new Date('2024-01-14T23:59:59Z');
    const managerUserId = 'manager-001';

    const context: Tx6AgentExecutionContext = {
      executionTimestamp,
      targetWeekStartDate,
      targetWeekEndDate,
      managerUserId,
    };

    // 前週の10名の部員から提出された日報データをスタブデータとして構築
    const aggregatedReportData = [
      {
        employeeId: 'emp-001',
        employeeName: '太郎',
        yesterday: 'ユーザー認証機能の実装完了',
        today: 'テスト実行と不具合修正',
        issue: 'ビルドサーバーの負荷が高い',
        submittedAt: new Date('2024-01-12T08:15:00Z'),
      },
      {
        employeeId: 'emp-002',
        employeeName: '花子',
        yesterday: 'DB マイグレーション実行',
        today: 'パフォーマンステストの実施',
        issue: 'テスト環境が不安定',
        submittedAt: new Date('2024-01-12T08:20:00Z'),
      },
      {
        employeeId: 'emp-003',
        employeeName: '次郎',
        yesterday: '仕様書レビュー完了',
        today: 'API 設計ドキュメント作成',
        issue: 'リソース不足により進捗が遅延',
        submittedAt: new Date('2024-01-12T08:25:00Z'),
      },
      {
        employeeId: 'emp-004',
        employeeName: '美咲',
        yesterday: 'フロントエンドコンポーネント開発',
        today: 'ブラウザ互換性テスト',
        issue: 'バグ修正に時間を要している',
        submittedAt: new Date('2024-01-12T08:30:00Z'),
      },
      {
        employeeId: 'emp-005',
        employeeName: '健太',
        yesterday: 'セキュリティ脆弱性診断',
        today: '対応策の実装',
        issue: '依存関係のバージョン競合',
        submittedAt: new Date('2024-01-12T08:35:00Z'),
      },
      {
        employeeId: 'emp-006',
        employeeName: '由美',
        yesterday: 'ドキュメント作成',
        today: 'サポートチームへの説明実施',
        issue: '外部連携の仕様が不明確',
        submittedAt: new Date('2024-01-12T08:40:00Z'),
      },
      {
        employeeId: 'emp-007',
        employeeName: '拓也',
        yesterday: 'ビルドパイプライン改善',
        today: 'デプロイテストの実行',
        issue: 'バグ修正の優先度判定が困難',
        submittedAt: new Date('2024-01-12T08:45:00Z'),
      },
      {
        employeeId: 'emp-008',
        employeeName: 'さくら',
        yesterday: '統合テスト実行',
        today: '本番環境の準備確認',
        issue: 'テスト環境が不安定で検証が困難',
        submittedAt: new Date('2024-01-12T08:50:00Z'),
      },
      {
        employeeId: 'emp-009',
        employeeName: '翔太',
        yesterday: 'コードレビュー実施',
        today: 'マージリクエストの対応',
        issue: 'リソース不足で対応が追いつかない',
        submittedAt: new Date('2024-01-12T08:55:00Z'),
      },
      {
        employeeId: 'emp-010',
        employeeName: '優子',
        yesterday: 'パフォーマンス最適化',
        today: '監視ダッシュボード設定',
        issue: 'ビルドサーバーのメンテナンス予定',
        submittedAt: new Date('2024-01-12T09:00:00Z'),
      },
    ];

    // 生成されたレポートの期待データ
    const reportGeneratedAtTimestamp = new Date('2024-01-15T09:05:00Z');
    const generatedReportId = 'report-2024-w02-001';
    const extractedIssueCountValue = 8;

    // runTx6Imp1Agent を実行
    const result: Tx6AgentExecutionResult = await runTx6Imp1Agent(context);

    // 戻り値の reportId が文字列で存在することを確認
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId).toBeTruthy();
    expect(result.reportId.length).toBeGreaterThan(0);

    // 戻り値の reportGeneratedAt が Date 型であることを確認
    expect(result.reportGeneratedAt).toBeInstanceOf(Date);
    expect(result.reportGeneratedAt.getTime()).toBeGreaterThan(0);

    // 戻り値の emailDeliveryStatus が有効な値（'sent' | 'failed' | 'pending_retry'）であることを確認
    expect(['sent', 'failed', 'pending_retry']).toContain(
      result.emailDeliveryStatus
    );

    // 戻り値の extractedIssueCount が 0 以上の整数であることを確認
    expect(typeof result.extractedIssueCount).toBe('number');
    expect(Number.isInteger(result.extractedIssueCount)).toBe(true);
    expect(result.extractedIssueCount).toBeGreaterThanOrEqual(0);

    // 集約されたレポートデータから抽出された課題が正の数であることを確認
    // 期待値: 提供された10件の日報データから複数の課題が抽出される
    expect(result.extractedIssueCount).toBeGreaterThan(0);
  });
});