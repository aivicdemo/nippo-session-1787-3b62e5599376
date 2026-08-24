import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorThresholdConfig,
  IssueSummary,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-1739
  test('should throw ValidationError when requestedBy is empty string', () => {
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'database-bottleneck',
        impactLevel: 'high',
      },
    ];

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: '',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/部長ユーザーID/);
  });
});