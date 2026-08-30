import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { verifyAdoptionReadiness } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - Adoption Readiness Verification', () => {
  let mockCalculateSubmissionRate: jest.Mock;
  let mockCalculateReportQualityScore: jest.Mock;
  let mockCalculateFormatUnificationDegree: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateSubmissionRate = jest.fn().mockReturnValue(0.95);
    mockCalculateReportQualityScore = jest.fn().mockReturnValue(85);
    mockCalculateFormatUnificationDegree = jest.fn().mockReturnValue(0.90);

    jest.mock('../../src/logic/adoption-training-management', () => {
      const actual = jest.requireActual('../../src/logic/adoption-training-management');
      return {
        ...actual,
        calculateSubmissionRate: mockCalculateSubmissionRate,
        calculateReportQualityScore: mockCalculateReportQualityScore,
        calculateFormatUnificationDegree: mockCalculateFormatUnificationDegree,
      };
    });
  });

  // SCEN-125
  test('should verify adoption readiness with all criteria met and return ready status', () => {
    const initialReportDataset = [
      {
        reportId: 'report-001',
        engineerId: 'eng-001',
        submittedAt: new Date('2026-01-28T09:00:00Z'),
        reportContent: 'Yesterday: Completed API implementation. Today: Code review and testing. Issues: Database connection timeout.',
      },
      {
        reportId: 'report-002',
        engineerId: 'eng-002',
        submittedAt: new Date('2026-01-28T09:15:00Z'),
        reportContent: 'Yesterday: Frontend UI development. Today: Integration testing. Issues: CSS framework compatibility.',
      },
      {
        reportId: 'report-003',
        engineerId: 'eng-003',
        submittedAt: new Date('2026-01-28T09:30:00Z'),
        reportContent: 'Yesterday: Documentation update. Today: Performance optimization. Issues: Memory leak in service.',
      },
    ];

    const totalEngineerCount = 10;
    const submissionDeadline = new Date('2026-01-31T23:59:59Z');

    const input = {
      initialReportDataset,
      totalEngineerCount,
      submissionDeadline,
    };

    const result = verifyAdoptionReadiness(input);

    expect(result.readinessStatus).toBe('ready');
    expect(result.verificationDate).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
    expect(result.productionStartDate).toBeDefined();
    expect(result.productionStartDate).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
    expect(result.blockers).toBeUndefined();
  });
});