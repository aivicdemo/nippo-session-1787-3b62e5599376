import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  test('SCEN-692: 優先度スコアが降順で複数並ぶ場合、色分け結果が昇順で統一されず矛盾が発生する', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: 'デプロイ失敗',
          impactLevel: 'high',
        },
        {
          issueId: 'issue-002',
          priorityScore: 72,
          keyword: 'テスト未実施',
          impactLevel: 'medium',
        },
        {
          issueId: 'issue-003',
          priorityScore: 90,
          keyword: 'セキュリティ脆弱性',
          impactLevel: 'high',
        },
        {
          issueId: 'issue-004',
          priorityScore: 68,
          keyword: 'ドキュメント不足',
          impactLevel: 'low',
        },
        {
          issueId: 'issue-005',
          priorityScore: 95,
          keyword: 'システムダウン',
          impactLevel: 'high',
        },
      ],
      colorThresholds: {
        redThresholdMin: 80,
        yellowThresholdMin: 60,
      },
      requestedBy: 'user-manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(5);
    expect(result.processedAt).toBeDefined();

    const coloredIssues = result.colorizedIssues;

    const issue068 = coloredIssues.find((i) => i.issueId === 'issue-004');
    const issue072 = coloredIssues.find((i) => i.issueId === 'issue-002');
    const issue085 = coloredIssues.find((i) => i.issueId === 'issue-001');
    const issue090 = coloredIssues.find((i) => i.issueId === 'issue-003');
    const issue095 = coloredIssues.find((i) => i.issueId === 'issue-005');

    expect(issue068).toBeDefined();
    expect(issue072).toBeDefined();
    expect(issue085).toBeDefined();
    expect(issue090).toBeDefined();
    expect(issue095).toBeDefined();

    const colorOrder = {
      green: 1,
      yellow: 2,
      red: 3,
    };

    const scoreToColorValue = (color: string | undefined) => {
      if (color === 'red') return 3;
      if (color === 'yellow') return 2;
      if (color === 'green') return 1;
      return 0;
    };

    const colorValue068 = scoreToColorValue(issue068!.highlightColor);
    const colorValue072 = scoreToColorValue(issue072!.highlightColor);
    const colorValue085 = scoreToColorValue(issue085!.highlightColor);
    const colorValue090 = scoreToColorValue(issue090!.highlightColor);
    const colorValue095 = scoreToColorValue(issue095!.highlightColor);

    const expectedOrder = [
      { score: 68, colorVal: colorValue068 },
      { score: 72, colorVal: colorValue072 },
      { score: 85, colorVal: colorValue085 },
      { score: 90, colorVal: colorValue090 },
      { score: 95, colorVal: colorValue095 },
    ];

    let hasInversion = false;
    for (let i = 0; i < expectedOrder.length - 1; i++) {
      if (expectedOrder[i].colorVal > expectedOrder[i + 1].colorVal) {
        hasInversion = true;
        break;
      }
    }

    const isColorsNotAscending =
      colorValue068 > colorValue072 ||
      colorValue072 > colorValue085 ||
      colorValue085 > colorValue090 ||
      colorValue090 > colorValue095 ||
      hasInversion;

    expect(isColorsNotAscending).toBe(true);

    expect(result.colorDistribution).toBeDefined();
    expect(result.colorDistribution.red).toBeGreaterThanOrEqual(0);
    expect(result.colorDistribution.yellow).toBeGreaterThanOrEqual(0);
    expect(result.colorDistribution.green).toBeGreaterThanOrEqual(0);
    expect(
      result.colorDistribution.red +
        result.colorDistribution.yellow +
        result.colorDistribution.green,
    ).toBe(5);
  });
});