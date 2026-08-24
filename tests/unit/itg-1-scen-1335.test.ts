import { describe, it, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  it('SCEN-1335: should throw exception when priority master fetch fails', () => {
    const testInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: '重要な案件の遅延',
          impactLevel: 'high'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-001'
    };

    const mockAdapterWithError = {
      fetchPriorityMaster: jest.fn().mockRejectedValueOnce(
        new Error('課題優先度スコアマスタが取得できません')
      )
    };

    expect(() =>
      prioritizeAndColorizeIssues(testInput, mockAdapterWithError)
    ).toThrow(/課題優先度スコアマスタが取得できません/);
  });
});