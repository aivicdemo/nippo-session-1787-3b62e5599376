import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Success Validation', () => {
  test('SCEN-1406: Idempotent archive function returns identical results on repeated execution with same input', () => {
    // Setup: Create test dataset with mock adapters
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'バグ', frequency: 3, confidence: 0.95 },
          { keyword: 'デプロイ', frequency: 2, confidence: 0.88 }
        ]
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        scores: [
          { keyword: 'バグ', impactScore: 78 },
          { keyword: 'デプロイ', impactScore: 65 }
        ]
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        classifications: [
          { keyword: 'バグ', severity: 'high' },
          { keyword: 'デプロイ', severity: 'medium' }
        ]
      })
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockReturnValue({
        success: true,
        deliveryStatus: 'sent',
        timestamp: new Date('2024-01-15T09:00:00Z')
      })
    };

    // Test data
    const sourceIssueData = [
      {
        issueId: 'issue-001',
        keyword: 'バグ',
        priorityScore: 78
      },
      {
        issueId: 'issue-002',
        keyword: 'デプロイ',
        priorityScore: 65
      }
    ];

    const integrationInput = {
      integrationId: 'integration-test-001',
      sourceIssueCount: 2,
      targetToolType: 'jira' as const,
      registeredIssueIds: ['jira-001', 'jira-002'],
      sourceIssueData: sourceIssueData
    };

    // Step 4: Execute first archive run
    const firstResult = validateToolIntegrationSuccess(
      integrationInput,
      mockTextAnalysisAdapter,
      mockNotificationAdapter
    );

    // Record all fields from first execution
    const firstKeywordResults = firstResult.validationStatus;
    const firstIsValid = firstResult.isValid;
    const firstRecommendedAction = firstResult.recommendedAction;
    const firstMismatchDetails = firstResult.mismatchDetails;

    // Step 5: Execute second archive run with identical inputs and mocks
    const secondResult = validateToolIntegrationSuccess(
      integrationInput,
      mockTextAnalysisAdapter,
      mockNotificationAdapter
    );

    // Step 6: Compare all fields between first and second execution
    expect(secondResult.validationStatus).toBe(firstKeywordResults);
    expect(secondResult.isValid).toBe(firstIsValid);
    expect(secondResult.recommendedAction).toBe(firstRecommendedAction);
    
    // Verify mismatch details consistency (both undefined or identical structure)
    if (firstMismatchDetails === undefined) {
      expect(secondResult.mismatchDetails).toBeUndefined();
    } else {
      expect(secondResult.mismatchDetails).toEqual(firstMismatchDetails);
    }

    // Verify idempotency: Complete object equality excluding timestamps
    expect({
      isValid: secondResult.isValid,
      validationStatus: secondResult.validationStatus,
      recommendedAction: secondResult.recommendedAction,
      mismatchDetails: secondResult.mismatchDetails
    }).toEqual({
      isValid: firstResult.isValid,
      validationStatus: firstResult.validationStatus,
      recommendedAction: firstResult.recommendedAction,
      mismatchDetails: firstResult.mismatchDetails
    });

    // Verify adapters were called consistently
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(2);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(2);
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(2);
  });
});