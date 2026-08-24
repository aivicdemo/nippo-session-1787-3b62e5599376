import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords - 権限検証とデータ確定機能', () => {
  // SCEN-1153: プロジェクトマネージャー権限がないユーザーが検証確定操作を行おうとしたとき権限エラーになる
  test('should reject keyword extraction confirmation when user lacks PM authority', async () => {
    // テストデータ準備: 一般メンバー権限を持つユーザーA
    const regularMemberUserId = 'user-member-001';
    const teamId = 'team-dev-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');

    // 入力パラメータ: 一般メンバーが権限確認なしに検証確定操作を試行
    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId: regularMemberUserId,
    };

    // TextAnalysisServiceAdapterのスタブ: 課題キーワード抽出が正常完了した状態をシミュレート
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { text: '遅延', frequency: 3 },
          { text: 'リスク', frequency: 2 },
        ],
        totalCount: 5,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: '遅延',
        impactScore: 65,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: '遅延',
        severity: 'high',
      }),
    };

    // 権限情報のモック: regularMemberUserIdにはPM権限がないことを示す
    const mockUserAuthority = {
      userId: regularMemberUserId,
      roles: ['member'], // PM権限なし
      hasProjectManagerRole: jest.fn().mockReturnValue(false),
    };

    // 検証確定操作を実行 → 権限エラーが発生することを期待
    const executeConfirmation = async () => {
      return extractAndRankIssueKeywords(
        input,
        mockTextAnalysisAdapter,
        mockUserAuthority
      );
    };

    // 期待結果: 権限エラーが発生
    await expect(executeConfirmation()).rejects.toThrow(/権限|PM|プロジェクトマネージャー/i);

    // 操作ログの検証: 失敗記録がされたことを確認
    expect(mockUserAuthority.hasProjectManagerRole).toHaveBeenCalledWith(
      regularMemberUserId
    );
  });
});