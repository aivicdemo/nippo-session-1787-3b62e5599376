import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

// SCEN-1615
describe('課題優先度スコア計算 - TextAnalysisServiceAdapter 正常応答処理', () => {
  test('classifyIssueSeverity が高・中・低の重要度分類を正確に返却する', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn((issueContent: string): string => {
        if (issueContent.includes('サーバーがダウンしてサービス停止状態')) {
          return '高';
        }
        if (issueContent.includes('報告書の書式確認が必要')) {
          return '中';
        }
        if (issueContent.includes('参考資料の整理')) {
          return '低';
        }
        return '中';
      }),
    };

    const highSeverityContent = 'サーバーがダウンしてサービス停止状態';
    const mediumSeverityContent = '報告書の書式確認が必要';
    const lowSeverityContent = '参考資料の整理';

    const highSeverityInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: highSeverityContent,
      occurrenceFrequency: 5,
      impactScore: 95,
      affectedTeamCount: 8,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T10:30:00Z',
      teamId: 'team-001',
    };

    const mediumSeverityInput: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: mediumSeverityContent,
      occurrenceFrequency: 3,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15T10:30:00Z',
      teamId: 'team-001',
    };

    const lowSeverityInput: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: lowSeverityContent,
      occurrenceFrequency: 1,
      impactScore: 20,
      affectedTeamCount: 1,
      resolutionDaysAverage: 7,
      reportingDate: '2024-01-15T10:30:00Z',
      teamId: 'team-001',
    };

    const highSeverityOutput: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      highSeverityInput,
      mockTextAnalysisServiceAdapter,
    );

    const mediumSeverityOutput: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      mediumSeverityInput,
      mockTextAnalysisServiceAdapter,
    );

    const lowSeverityOutput: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      lowSeverityInput,
      mockTextAnalysisServiceAdapter,
    );

    expect(highSeverityOutput.priorityRank).toBe('高');
    expect(mediumSeverityOutput.priorityRank).toBe('中');
    expect(lowSeverityOutput.priorityRank).toBe('低');

    expect(typeof highSeverityOutput.priorityRank).toBe('string');
    expect(typeof mediumSeverityOutput.priorityRank).toBe('string');
    expect(typeof lowSeverityOutput.priorityRank).toBe('string');

    expect(highSeverityOutput.issueId).toBe('issue-001');
    expect(mediumSeverityOutput.issueId).toBe('issue-002');
    expect(lowSeverityOutput.issueId).toBe('issue-003');

    expect(highSeverityOutput.priorityScore).toBeGreaterThanOrEqual(70);
    expect(mediumSeverityOutput.priorityScore).toBeGreaterThanOrEqual(40);
    expect(mediumSeverityOutput.priorityScore).toBeLessThan(70);
    expect(lowSeverityOutput.priorityScore).toBeLessThan(40);

    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      highSeverityContent,
    );
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      mediumSeverityContent,
    );
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      lowSeverityContent,
    );

    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(3);
  });
});