import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { updateIssueDataWithAnalysisResult } from '../../src/logic/issue-data-persistence';
import type { UpdateIssueAnalysisInput } from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence - updateIssueDataWithAnalysisResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-168
  test('should throw IssueDataNotFoundError when issueId does not exist in database', () => {
    const nonExistentIssueId = 'NON-EXISTENT-12345';
    const updateInput: UpdateIssueAnalysisInput = {
      issueId: nonExistentIssueId,
      priorityScore: 50,
      impactLevel: '中',
      analysisResult: {
        rootCause: 'Root cause analysis',
        proposedCountermeasure: 'Proposed countermeasure',
        estimatedResolutionDays: 5
      },
      updatedByUserId: 'user-001'
    };

    expect(() => updateIssueDataWithAnalysisResult(updateInput)).toThrow(/課題データが見つかりません。課題ID: NON-EXISTENT-12345/);
  });
});