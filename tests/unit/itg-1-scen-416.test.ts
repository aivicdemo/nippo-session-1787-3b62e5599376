import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { searchAndRetrieveReports } from '../../src/logic/report-search-and-retrieval';

jest.mock('../../src/logic/report-persistence');
jest.mock('../../src/logic/access-control-and-permissions');
jest.mock('../../src/logic/report-search-and-retrieval');

describe('report-search-and-retrieval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-416
  it('should exclude issues with empty keyword from deduplication and return ranked results', async () => {
    const searchCondition = {
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: new Date('2026-08-15T23:59:59Z'),
      keywordFilter: [],
      userId: 'user123',
      teamId: 'team-A'
    };

    const result = await searchAndRetrieveReports(searchCondition);

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].parentIssueId).toBe('issue-2');
    expect(result.issues[0].keyword).toBe('ネットワーク遅延');
    expect(result.issues[0].totalFrequency).toBe(2);
    expect(result.issues[0].isMerged).toBe(false);
    expect(result.totalCount).toBe(1);
    expect(result.searchExecutedAt).toBeInstanceOf(Date);
    expect(result.deduplicationSummary).toBeDefined();
    expect(result.deduplicationSummary.uniqueIssuesCount).toBe(1);
  });
});