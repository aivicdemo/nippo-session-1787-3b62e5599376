import { describe, test, expect } from '@jest/globals';
import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation', () => {
  // SCEN-1421: [error] 課題データアーカイブ機能 - 本体テーブル識別子が null のときエラーが返される
  test('should return error when primaryTableId is null', () => {
    const input = {
      integrationSessionId: 'session-12345',
      toolType: 'jira' as const,
      extractedIssueCount: 5,
      integrationTimestamp: new Date('2024-01-15T09:00:00Z'),
      primaryTableId: null,
      receivedIssueCount: 5,
    };

    const result = validateToolIntegrationSuccess(input);

    expect(result.isValid).toBe(false);
    expect(result.code).toBe('INVALID_TABLE_ID');
    expect(result.message).toBe('本体テーブル識別子が指定されていません');
  });
});