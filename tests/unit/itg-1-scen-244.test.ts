import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('日報集約メール生成機能 - 優先度スコア同一時の順序制御', () => {
  // SCEN-244: [edge] 日報集約メール生成機能 - 複数の課題が同一の優先度スコアで並ぶ場合、提出タイムスタンプの逆順で並ぶと課題一覧の順序が逆転する
  test('同一の優先度スコアを持つ複数課題は提出タイムスタンプの最新順で表示される', async () => {
    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: 'Engineer A',
          submittedAt: '2024-01-15T09:00:00Z',
          challenges: ['課題A: データベース接続遅延'],
        },
        {
          reporterId: 'engineer-002',
          reporterName: 'Engineer B',
          submittedAt: '2024-01-15T09:15:00Z',
          challenges: ['課題B: キャッシュ戦略の見直し'],
        },
        {
          reporterId: 'engineer-003',
          reporterName: 'Engineer C',
          submittedAt: '2024-01-15T09:30:00Z',
          challenges: ['課題C: ネットワーク最適化'],
        },
      ],
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00',
    };

    const result: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(input);

    expect(result).toBeDefined();
    expect(result.emailId).toBeDefined();
    expect(typeof result.emailId).toBe('string');
    expect(result.emailId.length).toBeGreaterThan(0);

    expect(result.sentAt).toBeDefined();
    expect(typeof result.sentAt).toBe('string');
    const sentDate = new Date(result.sentAt);
    expect(sentDate.getTime()).toBeGreaterThan(0);

    expect(result.recipientEmail).toBeDefined();
    expect(typeof result.recipientEmail).toBe('string');
    expect(result.recipientEmail.length).toBeGreaterThan(0);

    expect(result.includedIssueCount).toBe(3);

    expect(result.submissionSummary).toBeDefined();
    expect(result.submissionSummary.submittedCount).toBe(3);
    expect(result.submissionSummary.unsubmittedCount).toBe(0);
    expect(result.submissionSummary.submissionRate).toBe(1);

    expect(result.includesEmailBody).toBeDefined();
    const emailBody = result.includesEmailBody;
    expect(emailBody).toContain('課題C');
    expect(emailBody).toContain('課題B');
    expect(emailBody).toContain('課題A');

    const indexC = emailBody.indexOf('課題C');
    const indexB = emailBody.indexOf('課題B');
    const indexA = emailBody.indexOf('課題A');

    expect(indexC).toBeLessThan(indexB);
    expect(indexB).toBeLessThan(indexA);
  });
});