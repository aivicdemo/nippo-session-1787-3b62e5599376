import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateAndSendSummaryEmail, type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  it('SCEN-203: チームメンバー10名全員から日報提出完了時に、部長宛統一フォーマットメールが自動送信される', async () => {
    // テストデータセットアップ
    const teamId = 'team-001';
    const managerUserId = 'manager-001';
    const reportDate = '2024-01-15';
    const reportDeadlineTime = '09:00';

    // チームメンバー10名分の提出済み日報データ
    const submittedReports = [
      {
        reporterId: 'engineer-001',
        reporterName: 'エンジニア太郎',
        submittedAt: '2024-01-15T08:45:00Z',
        challenges: ['API設計の複雑性', 'パフォーマンス最適化が必要']
      },
      {
        reporterId: 'engineer-002',
        reporterName: 'エンジニア花子',
        submittedAt: '2024-01-15T08:46:00Z',
        challenges: ['テスト環境の安定性']
      },
      {
        reporterId: 'engineer-003',
        reporterName: 'エンジニア次郎',
        submittedAt: '2024-01-15T08:47:00Z',
        challenges: ['ドキュメント作成の遅延']
      },
      {
        reporterId: 'engineer-004',
        reporterName: 'エンジニア美咲',
        submittedAt: '2024-01-15T08:48:00Z',
        challenges: []
      },
      {
        reporterId: 'engineer-005',
        reporterName: 'エンジニア健太',
        submittedAt: '2024-01-15T08:49:00Z',
        challenges: ['チーム間の連携']
      },
      {
        reporterId: 'engineer-006',
        reporterName: 'エンジニア由美',
        submittedAt: '2024-01-15T08:50:00Z',
        challenges: ['メモリリーク検出']
      },
      {
        reporterId: 'engineer-007',
        reporterName: 'エンジニア拓也',
        submittedAt: '2024-01-15T08:51:00Z',
        challenges: ['セキュリティ対応']
      },
      {
        reporterId: 'engineer-008',
        reporterName: 'エンジニア麗子',
        submittedAt: '2024-01-15T08:52:00Z',
        challenges: ['デプロイメント失敗']
      },
      {
        reporterId: 'engineer-009',
        reporterName: 'エンジニア翔太',
        submittedAt: '2024-01-15T08:53:00Z',
        challenges: ['外部APIの遅延']
      },
      {
        reporterId: 'engineer-010',
        reporterName: 'エンジニア奈々',
        submittedAt: '2024-01-15T08:54:00Z',
        challenges: ['要件定義の曖昧さ', 'クライアント対応']
      }
    ];

    // 未提出メンバーなし（10名全員提出完了）
    const unsubmittedMemberIds: string[] = [];

    // 入力パラメータを構築
    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports,
      unsubmittedMemberIds,
      reportDeadlineTime
    };

    // メール送信のスタブを作成
    const sentEmails: {
      emailId: string;
      sentAt: string;
      recipientEmail: string;
      includedIssueCount: number;
      submissionSummary: { submittedCount: number; unsubmittedCount: number; submissionRate: number };
    }[] = [];

    const mockEmailService = {
      sendEmail: jest.fn(async (recipientEmail: string, subject: string, body: string) => {
        const emailId = `email-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const sentAt = new Date().toISOString();
        
        // 課題を集計：提出済み日報に含まれる課題の総数を数える
        const allChallenges = submittedReports.flatMap(r => r.challenges);
        const includedIssueCount = allChallenges.length;

        const sentEmail = {
          emailId,
          sentAt,
          recipientEmail,
          includedIssueCount,
          submissionSummary: {
            submittedCount: submittedReports.length,
            unsubmittedCount: unsubmittedMemberIds.length,
            submissionRate: submittedReports.length > 0 ? (submittedReports.length / (submittedReports.length + unsubmittedMemberIds.length)) * 100 : 0
          }
        };
        
        sentEmails.push(sentEmail);
        return emailId;
      })
    };

    // 関数の実行
    const output = await generateAndSendSummaryEmail(input, mockEmailService as any);

    // 期待値の検証
    // 1. メールが1件だけ送信されたことを確認
    expect(sentEmails).toHaveLength(1);

    // 2. メール送信の戻り値の確認
    expect(output).toBeDefined();
    expect(output.emailId).toBeDefined();
    expect(output.emailId).toMatch(/^email-/);

    // 3. メール送信完了日時がISO 8601形式であることを確認
    expect(output.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 4. 送信先メールアドレスが記録されていることを確認
    expect(output.recipientEmail).toBeDefined();

    // 5. 含まれた優先度付き課題の件数を確認
    // 提出済みの10名から報告された課題は全部で9件（エンジニア004は課題なし）
    const expectedIssueCount = 9;
    expect(output.includedIssueCount).toBe(expectedIssueCount);

    // 6. 提出状況サマリーの確認
    expect(output.submissionSummary).toBeDefined();
    expect(output.submissionSummary.submittedCount).toBe(10);
    expect(output.submissionSummary.unsubmittedCount).toBe(0);
    expect(output.submissionSummary.submissionRate).toBe(100);

    // 7. メール送信スタブが正しく呼ばれたことを確認
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
    
    // 8. 呼び出し引数の検証
    const callArgs = mockEmailService.sendEmail.mock.calls[0];
    expect(callArgs[0]).toBeDefined(); // recipientEmail
    expect(callArgs[1]).toContain('【朝会報告】'); // 件名に朝会報告が含まれる
    expect(callArgs[1]).toContain('本日の日報集約'); // 件名に本日の日報集約が含まれる
    expect(callArgs[2]).toBeDefined(); // 本文
  });
});