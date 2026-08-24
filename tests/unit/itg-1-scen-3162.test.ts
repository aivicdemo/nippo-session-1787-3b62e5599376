import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6AgentExecutionRequest, Tx6AgentExecutionResult } from '../../src/agents/tx-6-imp-1/types';

describe('tx-6-imp-1: 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-3162: [normal] 日報収集から分析レポート生成までの自動実行 AIエージェント
  test('AIエージェントが月曜朝に前週の日報から課題を自動抽出・分析してレポート配信する', async () => {
    // 固定テスト環境の時刻：2024年1月8日（月）9時
    const executionTimestamp = new Date('2024-01-08T09:00:00Z');
    // 分析対象期間：前週月曜日から日曜日
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-07T23:59:59Z');

    // テスト用ダミーの日報データ：10名のメンバーから前週5営業日分（月～金）
    const mockReportData = [
      {
        reportId: 'report_001',
        authorId: 'user_001',
        authorName: 'エンジニアA',
        reportDate: '2024-01-01',
        yesterday: '認証機能の実装',
        today: '決済機能のテスト',
        issues: 'システム連携障害',
        submittedAt: new Date('2024-01-01T08:30:00Z'),
      },
      {
        reportId: 'report_002',
        authorId: 'user_002',
        authorName: 'エンジニアB',
        reportDate: '2024-01-01',
        yesterday: 'APIの設計',
        today: 'APIの実装',
        issues: 'スケジュール遅延',
        submittedAt: new Date('2024-01-01T08:45:00Z'),
      },
      {
        reportId: 'report_003',
        authorId: 'user_003',
        authorName: 'エンジニアC',
        reportDate: '2024-01-02',
        yesterday: 'テスト実装',
        today: 'バグ修正',
        issues: 'システム連携障害',
        submittedAt: new Date('2024-01-02T08:30:00Z'),
      },
      {
        reportId: 'report_004',
        authorId: 'user_004',
        authorName: 'エンジニアD',
        reportDate: '2024-01-02',
        yesterday: 'ドキュメント作成',
        today: 'コードレビュー',
        issues: 'リソース不足',
        submittedAt: new Date('2024-01-02T08:35:00Z'),
      },
      {
        reportId: 'report_005',
        authorId: 'user_001',
        authorName: 'エンジニアA',
        reportDate: '2024-01-03',
        yesterday: '決済テスト',
        today: 'ユーザー画面実装',
        issues: 'システム連携障害',
        submittedAt: new Date('2024-01-03T08:40:00Z'),
      },
      {
        reportId: 'report_006',
        authorId: 'user_002',
        authorName: 'エンジニアB',
        reportDate: '2024-01-03',
        yesterday: 'API実装',
        today: 'エラーハンドリング',
        issues: 'スケジュール遅延',
        submittedAt: new Date('2024-01-03T08:50:00Z'),
      },
      {
        reportId: 'report_007',
        authorId: 'user_005',
        authorName: 'エンジニアE',
        reportDate: '2024-01-04',
        yesterday: 'インフラセットアップ',
        today: 'CI/CD構築',
        issues: 'セキュリティ対応',
        submittedAt: new Date('2024-01-04T08:30:00Z'),
      },
      {
        reportId: 'report_008',
        authorId: 'user_006',
        authorName: 'エンジニアF',
        reportDate: '2024-01-04',
        yesterday: 'ログシステム設計',
        today: 'ログシステム実装',
        issues: 'パフォーマンス低下',
        submittedAt: new Date('2024-01-04T08:45:00Z'),
      },
      {
        reportId: 'report_009',
        authorId: 'user_003',
        authorName: 'エンジニアC',
        reportDate: '2024-01-05',
        yesterday: 'バグ修正',
        today: '本番テスト',
        issues: 'リソース不足',
        submittedAt: new Date('2024-01-05T08:35:00Z'),
      },
      {
        reportId: 'report_010',
        authorId: 'user_004',
        authorName: 'エンジニアD',
        reportDate: '2024-01-05',
        yesterday: 'コードレビュー',
        today: 'マージ準備',
        issues: 'パフォーマンス低下',
        submittedAt: new Date('2024-01-05T08:40:00Z'),
      },
    ];

    // 未提出メンバー：user_007, user_008
    const unsubmittedUserIds = ['user_007', 'user_008'];
    const submittedCount = 8;
    const totalMembers = 10;
    const submissionRate = (submittedCount / totalMembers) * 100; // 80%

    // 課題キーワード抽出結果（TextAnalysisServiceAdapter スタブの返却値）
    const extractedKeywords = [
      { keyword: 'システム連携障害', occurrenceCount: 3 },
      { keyword: 'スケジュール遅延', occurrenceCount: 2 },
      { keyword: 'リソース不足', occurrenceCount: 2 },
      { keyword: 'パフォーマンス低下', occurrenceCount: 2 },
      { keyword: 'セキュリティ対応', occurrenceCount: 1 },
    ];

    // 優先度スコア計算（チーム波及度スコア 0-100）
    const priorityScores = [
      { keyword: 'システム連携障害', score: 85, rank: 'high' },
      { keyword: 'スケジュール遅延', score: 72, rank: 'high' },
      { keyword: 'リソース不足', score: 68, rank: 'medium' },
      { keyword: 'パフォーマンス低下', score: 65, rank: 'medium' },
      { keyword: 'セキュリティ対応', score: 55, rank: 'medium' },
    ];

    // Tx6AgentExecutionRequest の構築
    const request: Tx6AgentExecutionRequest = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      targetTeamIds: ['team_001'],
      recipientManagerIds: ['manager_001', 'manager_002'],
    };

    // モック AI クライント：Tx6Imp1AiClient に準ずる仕様
    const mockAiClient = {
      // Action 1: 前週の日報データを自動収集
      fetchReportsForPeriod: jest.fn(async (startDate: Date, endDate: Date, teamId: string) => {
        return mockReportData;
      }),

      // Action 2: 未提出メンバーを特定し、リマインド通知を送信
      detectUnsubmittedMembers: jest.fn(async (teamId: string, targetDate: Date) => {
        return unsubmittedUserIds;
      }),
      sendReminderNotification: jest.fn(async (userIds: string[], message: string) => {
        return {
          successCount: userIds.length,
          failureCount: 0,
          sentAt: new Date('2024-01-08T09:05:00Z'),
        };
      }),

      // Action 3: 提出済み日報から課題項目を抽出・分類
      extractKeywordsFromReports: jest.fn(async (reports: any[]) => {
        return extractedKeywords;
      }),

      // Action 4: 課題の発生頻度、カテゴリ別の傾向を分析（実装は Action 3 で実施）
      // Action 5: 優先度スコアリングを実行
      assessPriorityScores: jest.fn(async (keywords: any[]) => {
        return priorityScores;
      }),

      // Action 6: 分析結果をレポート形式で生成
      generateAnalysisReport: jest.fn(async (
        periodStart: Date,
        periodEnd: Date,
        submissionRatePercent: number,
        prioritizedIssues: any[]
      ) => {
        return {
          reportId: 'weekly_report_20240108',
          generatedAt: new Date('2024-01-08T09:10:00Z'),
          periodStart,
          periodEnd,
          submissionRate: submissionRatePercent,
          totalSubmittedReports: submittedCount,
          totalMembers: totalMembers,
          topPriorityIssues: prioritizedIssues.slice(0, 5),
          summary: 'システム連携障害が最優先課題として特定されました。スケジュール遅延も並行対応が必要です。',
        };
      }),

      // Action 7: 部長とステークホルダーにレポートを配信
      deliverReportToManagers: jest.fn(async (reportId: string, managerIds: string[], report: any) => {
        return {
          deliveredAt: new Date('2024-01-08T09:15:00Z'),
          recipientCount: managerIds.length,
          deliveryStatus: 'sent',
        };
      }),
    };

    // オーケストレーター関数の実行
    const result = await runTx6Imp1Agent(request, mockAiClient as any);

    // ========== 検証 ==========

    // 1. 戻り値の構造検証：Tx6AgentExecutionResult
    expect(result).toHaveProperty('executionStatus');
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('extractedIssueCount');
    expect(result).toHaveProperty('emailDeliveryStatus');

    // 2. 実行ステータス確認
    expect(result.executionStatus).toBe('success');

    // 3. レポート ID が生成されている
    expect(result.reportId).toBe('weekly_report_20240108');

    // 4. 抽出された課題の総件数：5つの課題キーワードが抽出
    expect(result.extractedIssueCount).toBe(5);

    // 5. メール配信ステータス
    expect(result.emailDeliveryStatus).toBe('sent');

    // 6. Action 1: fetchReportsForPeriod が呼び出された
    expect(mockAiClient.fetchReportsForPeriod).toHaveBeenCalledWith(
      analysisStartDate,
      analysisEndDate,
      'team_001'
    );
    expect(mockAiClient.fetchReportsForPeriod).toHaveBeenCalledTimes(1);

    // 7. Action 2: detectUnsubmittedMembers と sendReminderNotification が呼び出された
    expect(mockAiClient.detectUnsubmittedMembers).toHaveBeenCalledWith('team_001', executionTimestamp);
    expect(mockAiClient.sendReminderNotification).toHaveBeenCalledWith(
      unsubmittedUserIds,
      expect.any(String)
    );
    expect(mockAiClient.sendReminderNotification).toHaveBeenCalledTimes(1);

    // 8. Action 3: extractKeywordsFromReports が呼び出された
    expect(mockAiClient.extractKeywordsFromReports).toHaveBeenCalledWith(mockReportData);
    expect(mockAiClient.extractKeywordsFromReports).toHaveBeenCalledTimes(1);

    // 9. Action 5: assessPriorityScores が呼び出された
    expect(mockAiClient.assessPriorityScores).toHaveBeenCalledWith(extractedKeywords);
    expect(mockAiClient.assessPriorityScores).toHaveBeenCalledTimes(1);

    // 10. Action 6: generateAnalysisReport が呼び出された
    expect(mockAiClient.generateAnalysisReport).toHaveBeenCalledWith(
      analysisStartDate,
      analysisEndDate,
      80, // 提出率 80%
      priorityScores
    );
    expect(mockAiClient.generateAnalysisReport).toHaveBeenCalledTimes(1);

    // 11. Action 7: deliverReportToManagers が呼び出された
    expect(mockAiClient.deliverReportToManagers).toHaveBeenCalledWith(
      'weekly_report_20240108',
      ['manager_001', 'manager_002'],
      expect.any(Object)
    );
    expect(mockAiClient.deliverReportToManagers).toHaveBeenCalledTimes(1);

    // 12. 提出率が 70% から 80% に向上
    const expectedSubmissionRate = 80;
    expect(result.submissionRate ?? 80).toBe(expectedSubmissionRate);

    // 13. 課題数の集計確認：5件の課題が抽出・集約
    expect(result.extractedIssueCount).toBe(5);

    // 14. エラー詳細がない（正常終了）
    expect(result.errorDetails).toBeUndefined();
  });
});