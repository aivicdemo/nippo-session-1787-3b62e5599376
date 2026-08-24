import { describe, test, expect, beforeEach } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type { BottleneckAnalysisInput, IssueTimeSeriesRecord } from '../../src/logic/monthly-performance-analysis';

describe('課題の時系列分析機能 - プロジェクトマネージャー以外の権限で分析実行がリクエストされたときエラーになる', () => {
  let analysisInput: BottleneckAnalysisInput;

  beforeEach(() => {
    const now = new Date('2024-01-15T12:00:00Z');
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');

    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-05T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 45,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'in_progress'
      },
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-06T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 40,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'in_progress'
      },
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-07T00:00:00Z'),
        occurrenceCount: 0,
        impactScore: 0,
        resolutionDaysElapsed: 4,
        resolutionStatus: 'resolved'
      }
    ];

    analysisInput = {
      analysisStartDate: startDate,
      analysisEndDate: endDate,
      issueTimeSeriesData: issueTimeSeriesData,
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: true
    };
  });

  test('SCEN-1956: プロジェクトマネージャー以外の権限で分析実行がリクエストされたときエラーになる', () => {
    const memberUserRequestorId = 'user-member-001';
    const unauthorizedInput = {
      ...analysisInput,
      requestorUserId: memberUserRequestorId,
      requestorRole: 'member' as const
    };

    expect(() => {
      analyzeBottleneckTrendWithTimeSeries(unauthorizedInput);
    }).toThrow(/権限/);
  });
});