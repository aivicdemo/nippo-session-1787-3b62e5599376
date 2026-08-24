import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('ダッシュボード色分け表示機能', () => {
  // SCEN-858: [error] ユーザーの権限情報が欠落している状態で色分け表示を実行したときエラーになる
  test('ユーザー権限情報がnullの場合、権限不足エラーを返す', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'ISS-001',
          priorityScore: 85,
          keyword: 'データベース接続エラー',
          impactLevel: 'high',
        },
        {
          issueId: 'ISS-002',
          priorityScore: 55,
          keyword: 'ログ出力の遅延',
          impactLevel: 'medium',
        },
        {
          issueId: 'ISS-003',
          priorityScore: 25,
          keyword: 'コメント記載漏れ',
          impactLevel: 'low',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-without-permission',
    };

    const mockPermissionChecker = {
      getUserPermission: (userId: string) => {
        if (userId === 'user-without-permission') {
          return null;
        }
        return { role: 'manager', accessLevel: 'full' };
      },
    };

    let result: ColorizedIssueList | { error: string; errorCode: string; statusCode: number };

    try {
      result = prioritizeAndColorizeIssues(
        input,
        mockPermissionChecker,
      );
    } catch (err: unknown) {
      if (err instanceof Error && 'statusCode' in err) {
        result = {
          error: err.message,
          errorCode: (err as any).errorCode || 'ERR_UNKNOWN',
          statusCode: (err as any).statusCode || 500,
        };
      } else {
        throw err;
      }
    }

    expect(result).toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/ユーザー権限情報が見つかりません/),
        errorCode: 'ERR_PERMISSION_INFO_MISSING',
        statusCode: 400,
      }),
    );

    if ('colorizedIssues' in result) {
      throw new Error('色分け表示が実行されるべきではありません');
    }
  });
});