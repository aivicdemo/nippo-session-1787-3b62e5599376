import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-1334
  test('should throw UnauthorizedException when user role is undefined', () => {
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'database_performance',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 55,
        keyword: 'api_latency',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-003',
        priorityScore: 25,
        keyword: 'documentation',
        impactLevel: 'low',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'user-unknown-role',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/権限/);
  });
});