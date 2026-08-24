import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation', () => {
  // SCEN-1412
  test('should return archive configuration error when archive threshold days is null', () => {
    const input = {
      isValid: true,
      receivedIssueCount: 10,
      mismatchDetails: [],
      nextAction: 'send_confirmation_email' as const,
      archiveThresholdDays: null,
    };

    const result = validateToolIntegrationSuccess(input);

    expect(result).toEqual({
      success: false,
      errorCode: 'ARCHIVE_CONFIG_ERROR',
      errorMessage: 'アーカイブ判定基準日数が設定されていません',
      httpStatusCode: 400,
    });
  });
});