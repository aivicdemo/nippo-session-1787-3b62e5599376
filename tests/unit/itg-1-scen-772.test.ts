import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { TextAnalysisServiceAdapter } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け表示機能', () => {
  // SCEN-772: [error] 課題自動抽出・優先度判定機能 - 優先度スコアが数値型でないとき、エラーを返す
  test('優先度スコアが数値型でない場合、型エラーをthrowする', () => {
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: async (text: string) => {
        return {
          keywords: ['サーバーダウン', '全機能停止'],
          frequency: [2, 1],
        };
      },
      assessImpactScore: async (keyword: string) => {
        // 型チェック対象：数値型ではなく文字列型で返却
        return '85' as any;
      },
      classifyIssueSeverity: async (text: string) => {
        return 'high';
      },
    };

    const reportText = 'サーバーダウンにより全機能停止';

    expect(async () => {
      await extractAndRankIssueKeywords(reportText, mockTextAnalysisAdapter);
    }).rejects.toThrow(/優先度スコア|数値型/);
  });
});