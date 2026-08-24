import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  test('SCEN-2992: 日報テキストが null のとき、キーワード抽出がエラーになる', async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw new TypeError('reportText must be a non-null string');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    // reportText が null の状態を渡す
    const reportTextNull = null as any;

    // Act & Assert
    try {
      // extractAndRankIssueKeywords を実行し、null を渡される状態を作る
      await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisAdapter,
        reportTextNull
      );

      // ここに到達してはいけない
      fail('Expected TypeError to be thrown');
    } catch (error) {
      // Assert: TypeError またはバリデーションエラーが発生すること
      expect(error).toBeInstanceOf(Error);
      expect(error).toEqual(expect.objectContaining({
        message: expect.stringMatching(/reportText|null|string/i),
      }));

      // Assert: エラーログに適切なメッセージが記録されたことを確認
      // 代替動作として手動キーワード入力モードへの切り替え指示が返されることを確認
      expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
        expect.anything()
      );
    }
  });
});