import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation', () => {
  // SCEN-1409: [error] 課題データアーカイブ機能 - 連携完了タイムスタンプが null のときエラーが返される
  test('should return validation error when integrationTimestamp is null', () => {
    const input = {
      integrationSessionId: 'session-001',
      toolType: 'jira' as const,
      extractedIssueCount: 5,
      integrationTimestamp: null as unknown as Date,
    };

    expect(() => validateToolIntegrationSuccess(input)).toThrow(/連携完了時刻/);
  });
});