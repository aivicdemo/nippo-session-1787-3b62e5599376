import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1728
  test('TextAnalysisServiceAdapter の extractKeywords が3回のリトライ後も失敗したとき例外が throw される', async () => {
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn()
        .mockImplementationOnce(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TimeoutError')), 3000);
          });
        })
        .mockImplementationOnce(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TimeoutError')), 10000);
          });
        })
        .mockImplementationOnce(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TimeoutError')), 30000);
          });
        }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportText = '顧客システムの障害が発生。ネットワーク部門に報告した。本件は緊急対応が必要';

    await expect(async () => {
      await extractAndRankIssueKeywords(
        reportText,
        textAnalysisServiceAdapterStub
      );
    }).rejects.toThrow(/3回/);

    expect(textAnalysisServiceAdapterStub.extractKeywords).toHaveBeenCalledTimes(3);
  });
});