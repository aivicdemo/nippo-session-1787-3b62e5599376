import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput, SubmittedReportSummary } from '../../src/logic/notification-delivery';

const fetchMock = require('jest-fetch-mock');

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-247: [edge] 日報集約メール生成機能 - 複数のチームメンバーから同一の課題キーワードが報告された場合、発生頻度がメンバー数分だけ加算される
  test('複数メンバーから同一課題キーワード報告時、発生頻度がメンバー数分加算される', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const managerUserId = 'manager-001';
    const reportDeadlineTime = '09:00';

    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: 'user-a-001',
        reporterName: 'User A',
        submittedAt: '2024-01-15T08:45:00Z',
        challenges: ['データベース接続エラー', 'ネットワーク遅延']
      },
      {
        reporterId: 'user-b-002',
        reporterName: 'User B',
        submittedAt: '2024-01-15T08:50:00Z',
        challenges: ['データベース接続エラー', 'メモリ不足']
      },
      {
        reporterId: 'user-c-003',
        reporterName: 'User C',
        submittedAt: '2024-01-15T08:55:00Z',
        challenges: ['データベース接続エラー', 'ディスク容量警告']
      }
    ];

    const unsubmittedMemberIds: string[] = [];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports,
      unsubmittedMemberIds,
      reportDeadlineTime
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        emailId: 'email-001',
        sentAt: '2024-01-15T09:00:00Z',
        recipientEmail: 'manager@example.com',
        includedIssueCount: 3,
        submissionSummary: {
          submittedCount: 3,
          unsubmittedCount: 0,
          submissionRate: 100
        }
      }),
      { status: 200 }
    );

    const result: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(input);

    expect(result).toBeDefined();
    expect(result.emailId).toBe('email-001');
    expect(result.sentAt).toBe('2024-01-15T09:00:00Z');
    expect(result.recipientEmail).toBe('manager@example.com');
    expect(result.includedIssueCount).toBe(3);
    expect(result.submissionSummary.submittedCount).toBe(3);
    expect(result.submissionSummary.unsubmittedCount).toBe(0);
    expect(result.submissionSummary.submissionRate).toBe(100);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});