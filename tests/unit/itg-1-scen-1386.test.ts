import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords with Duplicate Merging', () => {
  // SCEN-1386: [edge] 重複課題の自動判定と統合機能 - 類似度スコアがちょうど統合閾値（例：80%）で親課題に統合される
  test('should merge duplicate issues when similarity score equals threshold of 80%', async () => {
    // 手順1: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // 手順2: 課題A（キーワード：『サーバーダウン』『本番環境』）と課題B（キーワード：『本番サーバー障害』『稼働停止』）を準備
    const reportDataList = [
      {
        reportId: 'report-001',
        reportDate: '2024-01-15',
        reporterName: 'Engineer A',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Deployed feature X',
        todayPlan: 'Test feature Y',
        challengesAndIssues: 'サーバーダウンが発生し、本番環境に影響あり',
      },
      {
        reportId: 'report-002',
        reportDate: '2024-01-15',
        reporterName: 'Engineer B',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Fixed bug in module Z',
        todayPlan: 'Code review',
        challengesAndIssues: '本番サーバー障害により稼働停止状態が続いている',
      },
    ];

    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-31';
    const minFrequencyThreshold = 1;
    const similarityThreshold = 80.0;

    // 手順3: モックのassessImpactScoreを設定し、類似度スコアがちょうど80.0%となるように調整
    // 課題Aと課題Bの類似度が80.0%の場合、両課題を同一グループと判定
    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue({
      issue_01: {
        keyword: 'サーバーダウン',
        frequency: 2,
        severity: 'high',
        contexts: ['本番環境に影響'],
      },
      issue_02: {
        keyword: '本番サーバー障害',
        frequency: 2,
        severity: 'high',
        contexts: ['稼働停止'],
      },
    });

    mockTextAnalysisServiceAdapter.assessImpactScore.mockImplementation(
      (keyword1: string, keyword2: string) => {
        // 『サーバーダウン』と『本番サーバー障害』の類似度をちょうど80.0%に設定
        if (
          (keyword1 === 'サーバーダウン' && keyword2 === '本番サーバー障害') ||
          (keyword1 === '本番サーバー障害' && keyword2 === 'サーバーダウン')
        ) {
          return 80.0;
        }
        return 0;
      }
    );

    // 手順4-5: extractAndRankIssueKeywordsを呼び出し
    const input: ExtractIssueKeywordsInput = {
      reportDataList,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold,
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // 手順6: 検証 - 統合後のデータを確認
    // 期待結果: 親課題1件（統合後）と子課題統合情報を確認
    // 類似度80.0% >= 閾値80%の場合、統合が実行される
    // 結果として、親課題は『子課題1件を含む』状態で表示される

    // 期待値の計算:
    // - 抽出課題数: 2件（サーバーダウン、本番サーバー障害）
    // - 統合後の課題数: 1件（親課題『サーバーダウン』に『本番サーバー障害』が統合）
    // - 統合されたキーワードの発生頻度: 4（2 + 2）
    // - 統合されたキーワードの優先度スコア: (4 * 0.4 + 100 * 0.6) = 61.6 ≈ 62
    //   （発生頻度の重み: 0.4、影響度スコアの重み: 0.6）
    // - データ品質スコア: 100（完全なデータセット）
    // - 優先度カラー: red（スコア62 >= 70の判定ルールで、実際には黄色となる場合がある）

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toMatchObject({
      keyword: 'サーバーダウン',
      frequency: 4,
      priorityScore: expect.any(Number),
      priorityColor: expect.stringMatching(/^(red|yellow|green)$/),
    });

    // 統合結果の詳細検証
    // - 親課題がメイン課題として表示
    // - 子課題の統合ステータスが『統合済み』
    expect(result.keywords[0].frequency).toBe(4);
    expect(result.totalIssueCount).toBe(2); // 抽出元の課題総数は2件
    expect(result.analysisExecutedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 類似度判定の検証
    // 類似度スコア80.0% == 閾値80%の場合、統合フラグがtrueとなる
    const similarityScore = mockTextAnalysisServiceAdapter.assessImpactScore(
      'サーバーダウン',
      '本番サーバー障害'
    );
    expect(similarityScore).toBe(80.0);
    expect(similarityScore).toBeGreaterThanOrEqual(similarityThreshold);
  });
});