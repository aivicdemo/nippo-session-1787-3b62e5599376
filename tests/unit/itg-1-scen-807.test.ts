import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - No Extracted Keywords and Zero Historical Frequency', () => {
  let mockTextAnalysisAdapter: any;
  let originalConsoleError: typeof console.error;
  let errorLogs: string[] = [];

  beforeEach(() => {
    errorLogs = [];
    originalConsoleError = console.error;
    console.error = (message: string) => {
      errorLogs.push(message);
    };

    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  // SCEN-807
  test('should halt processing and return null when no keywords extracted and historical frequency is zero', async () => {
    const testInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'No critical issues identified',
      occurrenceFrequency: 0,
      impactScore: 0,
      affectedTeamCount: 0,
      resolutionDaysAverage: 0,
      reportingDate: '2024-01-15T11:00:00Z',
      teamId: 'team-001',
    };

    const result = await calculateIssuePriorityScore(testInput, mockTextAnalysisAdapter);

    expect(result).toBeNull();
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(errorLogs.some((log) => /抽出済みキーワードが存在せず/.test(log))).toBe(true);
  });
});