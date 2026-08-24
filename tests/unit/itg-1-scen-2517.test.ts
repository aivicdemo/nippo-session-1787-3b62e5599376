import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2517: [error] 初回テスト報告の入力検証 - 課題発見フラグが真だが課題内容が空文字列のとき入力検証エラーが返される
  test('課題発見フラグがtrueで課題内容が空文字列のとき、VALIDATION_ERROR_ISSUE_CONTENT_REQUIREDエラーが返される', () => {
    const input = {
      userId: 'test-user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      yesterdayAccomplishment: 'ログイン機能の実装を完了した',
      todayPlan: 'API統合テストを実施する予定',
      challenges: '',
      hasIssueDiscovered: true,
      issueContent: '',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'issueContent',
          errorCode: 'VALIDATION_ERROR_ISSUE_CONTENT_REQUIRED',
          message: expect.stringMatching(/課題内容/),
        }),
      ])
    );
    expect(result.reportId).toBeUndefined();
  });
});