import { validateReportSubmission } from '../../src/logic/input-validation-and-formatting';

describe('朝会報告管理システム - 日報送信検証', () => {
  test('SCEN-144: 日報の必須項目充足、文字数制限、形式要件を一括検証し、合格判定を返す', () => {
    // Arrange
    const input = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      reportDate: '2026-08-20',
      yesterdayAccomplishment: '昨日は認証機能の実装を完了した。APIエンドポイントの設計から実装まで、セキュリティ要件を満たすTOKEN生成ロジックを整備した。DBへの永続化も含めて完了。',
      todayPlan: '本日はテスト実施予定',
      issueDescription: '認証トークンの有効期限設定が未決定。セキュリティとUX両面での検討が必要。',
      issuePriority: '中',
      issueKeywords: ['KEYWORD-001', 'KEYWORD-002'],
      attachmentUrls: [],
    };

    // Act
    const result = validateReportSubmission(input);

    // Assert
    expect(result.status).toBe('PASSED');
    expect(result.completenessScore).toBe(100);
    expect(result.accuracyScore).toBe(100);
    expect(result.utilityScore).toBe(100);
  });
});