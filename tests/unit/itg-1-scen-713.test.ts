import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-713: [error] 優先度スコアが数値でないとき処理がエラーになる
  test('優先度スコアが数値でない場合、エラーハンドリングが発動してユーザー画面にメッセージを表示', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue('invalid'),
      classifyIssueSeverity: jest.fn(),
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 'invalid' as unknown as number,
          keyword: '重大な障害が発生',
          impactLevel: 'high',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    let thrownError: Error | null = null;
    try {
      prioritizeAndColorizeIssues(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/Priority score must be a number/i);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Priority score must be a number/i)
    );

    consoleErrorSpy.mockRestore();
  });
});