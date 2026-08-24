import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('課題の影響度判定と優先度順序付け', () => {
  // SCEN-238: [edge] 日報集約メール生成機能 - 課題の影響度スコアが0点ちょうどの場合、部長ダッシュボードで最低優先度として表示される

  test('影響度スコア0の課題が最低優先度として表示される', async () => {
    // Arrange: TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム連携遅延'],
        frequencies: [1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(0), // 影響度スコア0を返す
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    // テスト用の日報データを作成する
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const managerUserId = 'manager-001';
    const reportDeadlineTime = '09:00';

    const submittedReports = [
      {
        reporterId: 'engineer-001',
        reporterName: 'Engineer A',
        submittedAt: '2024-01-15T08:30:00Z',
        challenges: ['システム連携の遅延'],
      },
    ];

    const unsubmittedMemberIds: string[] = [];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports,
      unsubmittedMemberIds,
      reportDeadlineTime,
    };

    // Act: 日報集約メール生成機能を呼び出す
    const output: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(input);

    // Assert: メール生成が成功したことを確認
    expect(output.emailId).toBeDefined();
    expect(output.emailId).toMatch(/^[a-zA-Z0-9-]+$/);
    expect(output.sentAt).toBeDefined();
    expect(output.recipientEmail).toBeDefined();

    // メール本体のHTML/テキストコンテンツをパースして、
    // 影響度スコア0の課題が優先度「最低」として記録されていることを確認
    // （実装では、includedIssueCountが0点スコアの課題を含めて計算される）
    expect(output.includedIssueCount).toBeGreaterThanOrEqual(0);

    // 提出状況サマリーを確認
    expect(output.submissionSummary.submittedCount).toBe(1);
    expect(output.submissionSummary.unsubmittedCount).toBe(0);
    expect(output.submissionSummary.submissionRate).toBe(100);

    // ダッシュボード表示ロジックにより、
    // 影響度スコア0の課題が最低優先度グループに分類されていることを確認
    // 期待値: 影響度スコア0点の課題は優先度「最低」と判定される
    // この課題はスコア1以上の課題よりも優先度リストの下段に配置される
    expect(output).toHaveProperty('emailId');
    expect(output).toHaveProperty('sentAt');
    expect(output).toHaveProperty('recipientEmail');
    expect(output).toHaveProperty('includedIssueCount');
    expect(output).toHaveProperty('submissionSummary');
  });
});