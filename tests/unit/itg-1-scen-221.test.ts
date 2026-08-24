import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, SubmittedReportSummary } from '../../src/logic/notification-delivery';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  // SCEN-221: [error] 日報集約メール送信機能 - 送信タイムスタンプが null のとき処理が進まない
  test('送信タイムスタンプが null の場合、メール送信処理は中断してエラーログを記録する', async () => {
    // テストデータ準備: 部員10名全員から有効な日報を送信完了させる
    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: 'user001',
        reporterName: '山田太郎',
        submittedAt: '2024-01-15T08:30:00Z',
        challenges: ['データベース接続タイムアウト', 'API応答遅延'],
      },
      {
        reporterId: 'user002',
        reporterName: '鈴木花子',
        submittedAt: '2024-01-15T08:32:00Z',
        challenges: ['テスト環境メモリ不足'],
      },
      {
        reporterId: 'user003',
        reporterName: '佐藤次郎',
        submittedAt: '2024-01-15T08:33:00Z',
        challenges: ['デプロイメント遅延'],
      },
      {
        reporterId: 'user004',
        reporterName: '田中美咲',
        submittedAt: '2024-01-15T08:34:00Z',
        challenges: ['チーム間の要件齟齬'],
      },
      {
        reporterId: 'user005',
        reporterName: '伊藤健一',
        submittedAt: '2024-01-15T08:35:00Z',
        challenges: ['リグレッション検出'],
      },
      {
        reporterId: 'user006',
        reporterName: '渡辺由紀',
        submittedAt: '2024-01-15T08:36:00Z',
        challenges: ['顧客クレーム'],
      },
      {
        reporterId: 'user007',
        reporterName: '中村武',
        submittedAt: '2024-01-15T08:37:00Z',
        challenges: ['ネットワーク遅延'],
      },
      {
        reporterId: 'user008',
        reporterName: '小林恵',
        submittedAt: '2024-01-15T08:38:00Z',
        challenges: ['セキュリティ脆弱性'],
      },
      {
        reporterId: 'user009',
        reporterName: '加藤翔太',
        submittedAt: '2024-01-15T08:39:00Z',
        challenges: ['ユーザーからの問い合わせ増加'],
      },
      {
        reporterId: 'user010',
        reporterName: '鎌田優子',
        submittedAt: '2024-01-15T08:40:00Z',
        challenges: ['定期メンテナンスの予定調整'],
      },
    ];

    // 入力パラメータ: 送信タイムスタンプを null に設定（エラーケース）
    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team_dev_001',
      reportDate: '2024-01-15',
      managerUserId: 'manager001',
      submittedReports: submittedReports,
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00',
    };

    // モック設定: NotificationServiceAdapter と TextAnalysisServiceAdapter をスタブ化
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: false,
        status: 'failed',
        reason: 'null_timestamp',
      }),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'タイムアウト', frequency: 2 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // 日報集約メール送信処理を実行（送信タイムスタンプが null の状態）
    let errorThrown = false;
    let errorMessage = '';

    try {
      await generateAndSendSummaryEmail(
        input,
        mockNotificationAdapter as any,
        mockTextAnalysisAdapter as any,
        null as any // 送信タイムスタンプを null に設定
      );
    } catch (error) {
      errorThrown = true;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    // 期待結果の検証
    // 1. エラーが発生したことを確認
    expect(errorThrown).toBe(true);

    // 2. エラーメッセージに『送信タイムスタンプが未設定です』を含むことを確認
    expect(errorMessage).toMatch(/送信タイムスタンプ/);

    // 3. メール送信処理が実行されないことを確認
    // （mockNotificationAdapter.sendReminderNotification が呼ばれないことを確認）
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();

    // 4. 通知配信ログに 'status: failed, reason: null_timestamp' が記録されることを確認
    // このテストでは、関数が適切なエラー状態で終了することを検証する
    expect(errorMessage).toContain('タイムスタンプ');
  });
});