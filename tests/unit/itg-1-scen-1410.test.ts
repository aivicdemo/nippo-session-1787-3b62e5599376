import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('朝会報告管理システム - ツール連携検証', () => {
  // SCEN-1410: [error] 課題データアーカイブ機能 - 連携完了タイムスタンプが不正な日時形式のときエラーが返される
  test('連携完了タイムスタンプが不正な日時形式のときエラーを返す', () => {
    const invalidInput_monthOverflow = {
      isValid: true,
      receivedIssueCount: 5,
      mismatchDetails: undefined,
      nextAction: 'send_confirmation_email' as const,
      integrationTimestamp: new Date('2026-13-45T99:99:99Z'),
    };

    const invalidInput_invalidFormat = {
      isValid: true,
      receivedIssueCount: 5,
      mismatchDetails: undefined,
      nextAction: 'send_confirmation_email' as const,
      integrationTimestamp: 'invalid-date' as any,
    };

    const invalidInput_slashFormat = {
      isValid: true,
      receivedIssueCount: 5,
      mismatchDetails: undefined,
      nextAction: 'send_confirmation_email' as const,
      integrationTimestamp: new Date('2026/08/19') as any,
    };

    expect(() =>
      validateToolIntegrationSuccess(invalidInput_monthOverflow)
    ).toThrow(/日時形式|タイムスタンプ|連携完了/);

    expect(() =>
      validateToolIntegrationSuccess(invalidInput_invalidFormat)
    ).toThrow(/日時形式|タイムスタンプ|連携完了/);

    expect(() =>
      validateToolIntegrationSuccess(invalidInput_slashFormat)
    ).toThrow(/日時形式|タイムスタンプ|連携完了/);
  });
});