import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Year Boundary Edge Case', () => {
  let originalDate: typeof Date;
  let mockDate: Date;

  beforeEach(() => {
    originalDate = Date;
    mockDate = new Date('2025-03-31T23:59:59Z');
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockDate.getTime());
        } else {
          super(...args);
        }
      }
      static now() {
        return mockDate.getTime();
      }
    } as any;
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  // SCEN-1545
  test('should calculate priority score accurately when aggregation period spans fiscal year boundary (Mar 31 to Apr 6)', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['API_timeout', 'database_lock'],
        frequency: [15, 12],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue_001',
      issueContent: 'API response timeout occurring in production',
      occurrenceFrequency: 15,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2025-03-28T10:30:00Z',
      teamId: 'team_dev_01',
    };

    const output = calculateIssuePriorityScore(input);

    expect(output).toBeDefined();
    expect(output.issueId).toBe('issue_001');
    expect(typeof output.priorityScore).toBe('number');
    expect(output.priorityScore).toBeGreaterThanOrEqual(1);
    expect(output.priorityScore).toBeLessThanOrEqual(100);
    expect(['高', '中', '低']).toContain(output.priorityRank);
    expect(output.scoreBreakdown).toBeDefined();
    expect(typeof output.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof output.scoreBreakdown.impactScore).toBe('number');
    expect(typeof output.scoreBreakdown.resolutionDifficultyScore).toBe('number');
    expect(output.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(output.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(output.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(output.colorCode);

    const calculatedAtDate = new Date(output.calculatedAt);
    expect(calculatedAtDate.getTime()).toBeLessThanOrEqual(
      new Date('2025-03-31T23:59:59Z').getTime() + 1000
    );

    const frequencyScoreExpected = Math.min(
      (input.occurrenceFrequency / 30) * 40,
      40
    );
    expect(output.scoreBreakdown.frequencyScore).toBeCloseTo(
      frequencyScoreExpected,
      1
    );

    const impactScoreExpected = Math.min((input.impactScore / 100) * 40, 40);
    expect(output.scoreBreakdown.impactScore).toBeCloseTo(
      impactScoreExpected,
      1
    );

    const resolutionDifficultyScoreExpected = Math.min(
      (input.resolutionDaysAverage / 10) * 20,
      20
    );
    expect(output.scoreBreakdown.resolutionDifficultyScore).toBeCloseTo(
      resolutionDifficultyScoreExpected,
      1
    );

    const expectedPriorityScore =
      frequencyScoreExpected +
      impactScoreExpected +
      resolutionDifficultyScoreExpected;
    expect(output.priorityScore).toBeCloseTo(expectedPriorityScore, 1);

    if (expectedPriorityScore >= 70) {
      expect(output.priorityRank).toBe('高');
      expect(output.colorCode).toBe('#FF0000');
    } else if (expectedPriorityScore >= 40) {
      expect(output.priorityRank).toBe('中');
      expect(output.colorCode).toBe('#FFFF00');
    } else {
      expect(output.priorityRank).toBe('低');
      expect(output.colorCode).toBe('#00FF00');
    }
  });

  test('should maintain accurate aggregation when system date transitions from Mar 31 to Apr 7 (fiscal year boundary)', () => {
    mockDate = new Date('2025-04-07T10:00:00Z');

    const input: IssuePriorityScoringInput = {
      issueId: 'issue_002',
      issueContent: 'Database connection pool exhaustion',
      occurrenceFrequency: 8,
      impactScore: 65,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: '2025-04-04T14:20:00Z',
      teamId: 'team_dev_01',
    };

    const output = calculateIssuePriorityScore(input);

    expect(output).toBeDefined();
    expect(output.issueId).toBe('issue_002');
    expect(typeof output.priorityScore).toBe('number');
    expect(output.priorityScore).toBeGreaterThanOrEqual(1);
    expect(output.priorityScore).toBeLessThanOrEqual(100);

    const reportingDateObj = new Date(input.reportingDate);
    const systemDateObj = new Date('2025-04-07T10:00:00Z');
    const daysDiff =
      (systemDateObj.getTime() - reportingDateObj.getTime()) /
      (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThanOrEqual(0);
    expect(daysDiff).toBeLessThan(31);

    const frequencyScoreExpected = Math.min((input.occurrenceFrequency / 30) * 40, 40);
    const impactScoreExpected = Math.min((input.impactScore / 100) * 40, 40);
    const resolutionDifficultyScoreExpected = Math.min(
      (input.resolutionDaysAverage / 10) * 20,
      20
    );

    const expectedPriorityScore =
      frequencyScoreExpected +
      impactScoreExpected +
      resolutionDifficultyScoreExpected;
    expect(output.priorityScore).toBeCloseTo(expectedPriorityScore, 1);
  });
});