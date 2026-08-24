import { describe, test, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-714: [error] 優先度別課題ハイライト表示機能 - 発生頻度が数値でないとき処理がエラーになる
  test('発生頻度が数値でないとき ValidationError を throw する', () => {
    const mockIssues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'ビルドエラー',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 55,
        keyword: 'テスト失敗',
        impactLevel: 'medium',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: mockIssues,
      colorThresholds: colorThresholds,
      requestedBy: 'manager-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/発生頻度/);
  });
});