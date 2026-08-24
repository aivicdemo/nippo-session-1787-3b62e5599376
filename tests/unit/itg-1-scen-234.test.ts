import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput, SubmittedReportSummary } from '../../src/logic/notification-delivery';

describe('generateAndSendSummaryEmail - チームメンバー10名中9名が報告完了時', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-234
  test('should generate summary email with 1 unsubmitted member in list when 9 of 10 team members submitted reports', () => {
    const teamId = 'team-001';
    const reportDate = '2024-11-21';
    const managerUserId = 'manager-001';
    const reportDeadlineTime = '09:00';

    const submittedMembers: SubmittedReportSummary[] = [
      {
        reporterId: 'member-001',
        reporterName: '太郎',
        submittedAt: '2024-11-21T08:45:00Z',
        challenges: ['データベース接続タイムアウト', 'ログイン機能のバグ'],
      },
      {
        reporterId: 'member-002',
        reporterName: '花子',
        submittedAt: '2024-11-21T08:50:00Z',
        challenges: ['API レスポンス遅延'],
      },
      {
        reporterId: 'member-003',
        reporterName: '次郎',
        submittedAt: '2024-11-21T08:55:00Z',
        challenges: ['テスト環境のディスク容量不足', 'デプロイスクリプトのエラー'],
      },
      {
        reporterId: 'member-004',
        reporterName: '美咲',
        submittedAt: '2024-11-21T08:40:00Z',
        challenges: ['ユーザー認証の問題'],
      },
      {
        reporterId: 'member-005',
        reporterName: '健太',
        submittedAt: '2024-11-21T08:35:00Z',
        challenges: [],
      },
      {
        reporterId: 'member-006',
        reporterName: '由美',
        submittedAt: '2024-11-21T08:52:00Z',
        challenges: ['ネットワーク遅延', 'サーバーメモリ不足'],
      },
      {
        reporterId: 'member-007',
        reporterName: '隆一',
        submittedAt: '2024-11-21T08:48:00Z',
        challenges: ['キャッシュ無効化の問題'],
      },
      {
        reporterId: 'member-008',
        reporterName: '由紀子',
        submittedAt: '2024-11-21T08:58:00Z',
        challenges: ['ビルドエラー'],
      },
      {
        reporterId: 'member-009',
        reporterName: '悟',
        submittedAt: '2024-11-21T08:30:00Z',
        challenges: ['監視アラートの誤検知', 'ログ解析の精度低下'],
      },
    ];

    const unsubmittedMemberIds = ['member-010'];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports: submittedMembers,
      unsubmittedMemberIds,
      reportDeadlineTime,
    };

    const result: GenerateAndSendSummaryEmailOutput = generateAndSendSummaryEmail(input);

    expect(result.emailId).toBeDefined();
    expect(result.emailId).toMatch(/^email-/);

    expect(result.sentAt).toBeDefined();
    expect(new Date(result.sentAt)).toBeInstanceOf(Date);

    expect(result.recipientEmail).toBeDefined();
    expect(result.recipientEmail).toContain('@');

    expect(result.includedIssueCount).toBe(10);

    expect(result.submissionSummary).toBeDefined();
    expect(result.submissionSummary.submittedCount).toBe(9);
    expect(result.submissionSummary.unsubmittedCount).toBe(1);
    expect(result.submissionSummary.submissionRate).toBe(90);

    expect(result.submissionSummary.unsubmittedMemberIds).toContain('member-010');
    expect(result.submissionSummary.unsubmittedMemberIds.length).toBe(1);
  });
});