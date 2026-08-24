import { describe, test, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度スコアによるダッシュボード強調表示機能', () => {
  // SCEN-728: [edge] 課題優先度スコアによるダッシュボード強調表示機能 - 優先度スコア 0～100 の端数が発生する値を正確に判定
  test('SCEN-728: 端数を含む優先度スコア（75.5、0.1、99.9、50.0）が正確に判定され、各々に対応した強調表示が適用される', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const scoreSequence = [75.5, 0.1, 99.9, 50.0];
    let callCount = 0;
    mockTextAnalysisAdapter.assessImpactScore.mockImplementation(() => {
      const score = scoreSequence[callCount % scoreSequence.length];
      callCount++;
      return score;
    });

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 75.5,
          keyword: 'データベース接続エラー',
          impactLevel: 'high',
        },
        {
          issueId: 'issue-002',
          priorityScore: 0.1,
          keyword: '軽微なUI調整',
          impactLevel: 'low',
        },
        {
          issueId: 'issue-003',
          priorityScore: 99.9,
          keyword: '本番環境障害',
          impactLevel: 'high',
        },
        {
          issueId: 'issue-004',
          priorityScore: 50.0,
          keyword: 'パフォーマンス改善',
          impactLevel: 'medium',
        },
      ],
      colorThresholds: {
        redThresholdMin: 85,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(
      input,
      mockTextAnalysisAdapter,
    );

    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(4);

    const issue_001 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001',
    );
    expect(issue_001).toBeDefined();
    expect(issue_001?.priorityScore).toBe(75.5);
    expect(issue_001?.colorCode).toBe('#FFFF00');
    expect(issue_001?.shouldHighlight).toBe(true);

    const issue_002 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002',
    );
    expect(issue_002).toBeDefined();
    expect(issue_002?.priorityScore).toBe(0.1);
    expect(issue_002?.colorCode).toBe('#00FF00');
    expect(issue_002?.shouldHighlight).toBe(false);

    const issue_003 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-003',
    );
    expect(issue_003).toBeDefined();
    expect(issue_003?.priorityScore).toBe(99.9);
    expect(issue_003?.colorCode).toBe('#FF0000');
    expect(issue_003?.shouldHighlight).toBe(true);

    const issue_004 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-004',
    );
    expect(issue_004).toBeDefined();
    expect(issue_004?.priorityScore).toBe(50.0);
    expect(issue_004?.colorCode).toBe('#FFFF00');
    expect(issue_004?.shouldHighlight).toBe(true);

    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(2);
    expect(result.colorDistribution.green).toBe(1);

    expect(result.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});