import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-1519
  test('[error] 日報データの配列が null のときエラーが発生する', () => {
    const nullReportData = null as any;

    expect(() => {
      calculateIssuePriorityScore(nullReportData);
    }).toThrow(/日報データ|配列|null/);
  });
});