import { describe, test, expect } from '@jest/globals';
import { saveExtractedIssueData } from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence', () => {
  test('SCEN-573: saveExtractedIssueData saves extracted issue data with encryption and returns completion status', () => {
    const input = {
      reportId: 'RPT-20250101-001',
      issueContent: 'Build system timeout during deployment',
      issueType: 'technical_issue',
      priorityScore: 85,
      impactLevel: 'high',
      extractedKeywords: ['build', 'timeout', 'deployment'],
      analysisResult: {
        rootCause: 'Insufficient server resources during peak hours',
        proposedCountermeasure: 'Implement resource scaling and monitoring',
        estimatedResolutionDays: 3,
      },
      executorId: 'PM-USER-001',
    };

    const result = saveExtractedIssueData(input);

    expect(result).toBeDefined();
    expect(result.issueDataId).toBeDefined();
    expect(typeof result.issueDataId).toBe('string');
    expect(result.issueDataId.length).toBeGreaterThan(0);

    expect(result.savedTimestamp).toBeDefined();
    expect(typeof result.savedTimestamp).toBe('string');
    const savedTime = new Date(result.savedTimestamp);
    expect(savedTime.getTime()).toBeLessThanOrEqual(Date.now());
    expect(savedTime.getTime()).toBeGreaterThan(Date.now() - 5000);

    expect(result.encryptionStatus).toBe('encrypted');
  });
});