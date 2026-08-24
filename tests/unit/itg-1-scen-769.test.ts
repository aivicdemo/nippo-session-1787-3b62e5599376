import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - undefined Challenge Text Handling', () => {
  let mockTextAnalysisServiceAdapter: any;
  let mockNotificationServiceAdapter: any;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-769
  test('should return error when challenge text is undefined during normalization', async () => {
    const input: any = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
      extractedChallenges: [
        {
          challengeId: 'challenge-001',
          content: undefined,
          occurrenceCount: 5,
          impactScore: 75,
        },
      ],
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      mockNotificationServiceAdapter
    );

    expect(result).toHaveProperty('error');
    expect(result.error).toHaveProperty('message');
    expect(result.error.message).toMatch(/課題テキストが不正です/);
    expect(result.error.message).toMatch(/undefined/);
    expect(result.error).toHaveProperty('code');
    expect(result.error.code).toBe('INVALID_ISSUE_TEXT');
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(0);
  });
});