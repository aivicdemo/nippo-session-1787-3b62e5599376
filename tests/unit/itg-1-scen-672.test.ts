import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorThresholdConfig,
  IssueSummary,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-672: [error] 課題優先度色分け表示機能 - 赤色のしきい値が null のとき色分けルールが破綻してエラーになる
  test('should throw ValidationError when red threshold is null in color threshold config', () => {
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: null as any,
      yellowThresholdMin: 40,
    };

    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'データベース接続エラー',
        impactLevel: 'high',
      },
    ];

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'user-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(
      /赤色しきい値/
    );
  });
});