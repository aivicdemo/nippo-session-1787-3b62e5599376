import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  test('SCEN-1327: 影響度スコアが100を超えるときに処理を中止し例外を発生させる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(101),
      classifyIssueSeverity: jest.fn(),
    };

    const keyword = 'システム障害';

    expect(() => {
      extractAndRankIssueKeywords(
        keyword,
        mockTextAnalysisServiceAdapter
      );
    }).toThrow(/影響度スコア/);
  });
});