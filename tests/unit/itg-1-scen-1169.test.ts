import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1169
  test('抽出された課題キーワードが発生頻度の降順でランク付けされて返される', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        'ログイン不可': 5,
        'データベース接続エラー': 3,
        'API応答遅延': 8,
        'メモリ不足': 2,
        'ネットワークタイムアウト': 6,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportText =
      'ログイン不可の問題が続いており、ネットワークタイムアウトとAPI応答遅延も報告されている。データベース接続エラーにも対応中。';

    const result = extractAndRankIssueKeywords(reportText, mockTextAnalysisAdapter);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(reportText);

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({
      keyword: 'API応答遅延',
      frequency: 8,
      rank: 1,
    });
    expect(result[1]).toEqual({
      keyword: 'ネットワークタイムアウト',
      frequency: 6,
      rank: 2,
    });
    expect(result[2]).toEqual({
      keyword: 'ログイン不可',
      frequency: 5,
      rank: 3,
    });
    expect(result[3]).toEqual({
      keyword: 'データベース接続エラー',
      frequency: 3,
      rank: 4,
    });
    expect(result[4]).toEqual({
      keyword: 'メモリ不足',
      frequency: 2,
      rank: 5,
    });
  });
});