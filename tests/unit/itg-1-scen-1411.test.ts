import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('朝会報告管理システム - 課題データアーカイブ機能', () => {
  test('SCEN-1411: アーカイブ判定基準日数が0以下のときエラーが返される', () => {
    // 初期化: アーカイブ判定基準日数を0に設定したInput
    const input = {
      integrationSessionId: 'session-20240115-001',
      toolType: 'jira' as const,
      extractedIssueCount: 5,
      integrationTimestamp: new Date('2024-01-15T09:00:00Z'),
      archiveDaysThreshold: 0,
    };

    // 実行: 課題データアーカイブ機能のバリデーション呼び出し
    const result = validateToolIntegrationSuccess(input);

    // 検証: エラーオブジェクトが返却されること
    expect(result.isValid).toBe(false);
    expect(result.validationStatus).toBe('mismatch');
    
    // 検証: エラーコード『ARCHIVE_DAYS_INVALID』が含まれること
    const mismatchDetail = result.mismatchDetails?.find(
      detail => detail.issueId === 'ARCHIVE_DAYS_INVALID'
    );
    expect(mismatchDetail).toBeDefined();
    expect(mismatchDetail?.mismatchType).toBe('field_value');
    
    // 検証: エラーメッセージ『アーカイブ判定基準日数は1日以上で設定してください』が含まれること
    expect(mismatchDetail?.expectedValue).toMatch(/アーカイブ判定基準日数は1日以上/);
    
    // 検証: 次のアクション指示が『manual_review』(手動確認)であること
    expect(result.recommendedAction).toBe('manual_review');
  });
});