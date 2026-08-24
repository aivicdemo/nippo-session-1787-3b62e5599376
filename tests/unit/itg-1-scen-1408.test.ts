import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation', () => {
  // SCEN-1408
  test('should return error when issue ID is empty string during archive validation', () => {
    const emptyIssueId = '';
    const integrationSessionId = 'session-001';
    const toolType = 'jira' as const;
    const extractedIssueCount = 5;
    const integrationTimestamp = new Date('2024-01-15T09:00:00Z');

    const input = {
      integrationSessionId,
      toolType,
      extractedIssueCount,
      integrationTimestamp,
    };

    const validationInput = {
      integrationId: emptyIssueId,
      sourceIssueCount: extractedIssueCount,
      targetToolType: toolType,
      registeredIssueIds: [],
      sourceIssueData: [],
    };

    expect(() => {
      validateToolIntegrationSuccess(validationInput);
    }).toThrow(/課題ID|issue.*id/i);
  });
});