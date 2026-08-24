import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  test('SCEN-711: 優先度閾値が undefined のとき TypeError をスロー', () => {
    const issues = [
      {
        issueId: 'issue-001',
        priorityScore: 75,
        keyword: 'ネットワーク遅延',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 50,
        keyword: 'ドキュメント不足',
        impactLevel: 'medium',
      },
    ];

    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = 'user-department-head-001';

    expect(() => {
      prioritizeAndColorizeIssues(
        {
          issues,
          colorThresholds,
          requestedBy,
        },
        undefined as any
      );
    }).toThrow(TypeError);
  });
});