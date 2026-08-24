import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示する機能', () => {
  // SCEN-712: [error] 優先度別課題ハイライト表示機能 - 優先度閾値が負の値のとき処理がエラーになる
  test('should throw validation error when threshold is negative value', () => {
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'データベース接続エラー',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 45,
        keyword: 'ドキュメント更新遅延',
        impactLevel: 'medium',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: -5,
      yellowThresholdMin: 40,
    };

    const requestedBy = 'user-manager-001';

    expect(() =>
      prioritizeAndColorizeIssues(issues, colorThresholds, requestedBy)
    ).toThrow(/優先度閾値は0以上の整数である必要があります/);
  });
});

interface IssueSummary {
  issueId: string;
  priorityScore: number;
  keyword: string;
  impactLevel: string;
}

interface ColorThresholdConfig {
  redThresholdMin: number;
  yellowThresholdMin: number;
}