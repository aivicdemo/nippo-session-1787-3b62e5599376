import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { analyzeIssueRecurrencePatterns } from '../../src/logic/report-search-and-retrieval';
import type { IssueRecurrenceAnalysisInput } from '../../src/logic/report-search-and-retrieval';

describe('朝会報告管理システム - 課題再発パターン分析', () => {
  // SCEN-533: 集約期間が指定されていないときに例外がスローされることを検証
  test('should throw error when aggregationPeriod is undefined in deduplicateAndMergeIssues call', async () => {
    const input: IssueRecurrenceAnalysisInput = {
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-19T23:59:59Z'),
      requestingUserId: 'user-001',
    };

    expect(() => analyzeIssueRecurrencePatterns(input)).toThrow(/集約対象期間/);
  });
});