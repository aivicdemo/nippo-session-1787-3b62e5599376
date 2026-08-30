import { validateReportInput, type ReportInputData, type ValidationResult } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報入力検証', () => {
  // SCEN-041: [normal] 日報の必須項目充足、文字数制限、形式要件を検証し、検証結果と修正対象項目を返す
  test('validateReportInputが代表的な正常入力を設計どおり処理する', () => {
    // Arrange
    const reportInputData: ReportInputData = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      yesterdayAccomplishment: '昨日の実績：機能Xの実装完了',
      todayPlan: '今日の予定：テスト実行と修正',
      issueDescription: '本日の課題：データベース接続のタイムアウト発生',
      issueKeywords: [],
      attachmentUrls: undefined,
    };

    // Act
    const validationResult: ValidationResult = validateReportInput(reportInputData);

    // Assert
    expect(validationResult.status).toBe('PASSED');
    expect(validationResult.completenessScore).toBe(100);
    expect(validationResult.accuracyScore).toBe(100);
    expect(validationResult.utilityScore).toBe(100);
    expect(validationResult.errors).toEqual([]);
  });
});