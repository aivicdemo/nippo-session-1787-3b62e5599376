import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Prioritization and Colorization', () => {
  // SCEN-716
  test('should throw error when color mapping configuration is undefined', () => {
    const colorThresholds: ColorThresholdConfig | undefined = undefined;
    
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: 'システム障害',
          impactLevel: 'high'
        }
      ],
      colorThresholds: colorThresholds as any,
      requestedBy: 'manager-001'
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/色分けマッピング設定/);
  });
});