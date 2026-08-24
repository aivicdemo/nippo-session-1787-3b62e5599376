import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation', () => {
  // SCEN-1418
  test('should return error when archive target issues array is empty', () => {
    const emptyIssueArray: string[] = [];
    const integrationSessionId = 'session-123';
    const toolType = 'jira' as const;
    const extractedIssueCount = 0;
    const integrationTimestamp = new Date('2024-01-15T10:00:00Z');

    const result = validateToolIntegrationSuccess({
      integrationSessionId,
      toolType,
      extractedIssueCount,
      integrationTimestamp,
      archiveTargetIssues: emptyIssueArray,
    });

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('EMPTY_ARCHIVE_ARRAY');
    expect(result.errorMessage).toBe('アーカイブ対象の課題が指定されていません');
    expect(result.archiveExecuted).toBe(false);
    expect(result.archiveHistoryRecorded).toBe(false);
  });
});