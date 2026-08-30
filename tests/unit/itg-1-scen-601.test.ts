import { verifyAdoptionReadiness } from '../../src/logic/adoption-training-management';

describe('Adoption Training Management - Onboarding Readiness Verification', () => {
  // SCEN-601: [normal] 初回テスト報告データから提出率・データ品質スコア・形式統一度を計算し、3条件すべて満たすかを判定して本格運用への移行可否を決定する
  test('should verify adoption readiness and determine production start eligibility when all criteria are met', () => {
    const initialReportDataset = [
      {
        reportId: 'report_001',
        engineerId: 'eng_001',
        submittedAt: new Date('2026-01-14T09:30:00Z'),
        reportContent: 'Yesterday: Fixed login bug. Today: Review PRs. Issues: Database connection timeout',
      },
      {
        reportId: 'report_002',
        engineerId: 'eng_002',
        submittedAt: new Date('2026-01-14T10:15:00Z'),
        reportContent: 'Yesterday: Implemented feature X. Today: Write unit tests. Issues: API rate limiting',
      },
      {
        reportId: 'report_003',
        engineerId: 'eng_003',
        submittedAt: new Date('2026-01-14T08:45:00Z'),
        reportContent: 'Yesterday: Code review. Today: Refactor module. Issues: Performance degradation',
      },
      {
        reportId: 'report_004',
        engineerId: 'eng_004',
        submittedAt: new Date('2026-01-14T11:00:00Z'),
        reportContent: 'Yesterday: Setup CI/CD. Today: Monitor builds. Issues: Deployment failed',
      },
      {
        reportId: 'report_005',
        engineerId: 'eng_005',
        submittedAt: new Date('2026-01-14T09:50:00Z'),
        reportContent: 'Yesterday: Documentation. Today: Team meeting. Issues: None reported',
      },
    ];

    const totalEngineerCount = 10;
    const submissionDeadline = new Date('2026-01-15T23:59:59Z');

    // Mock the calculation functions
    const mockCalculateSubmissionRate = jest.fn(() => 95);
    const mockCalculateReportQualityScore = jest.fn(() => 85);
    const mockCalculateFormatUnificationDegree = jest.fn(() => 90);

    // Temporarily replace the module functions with mocks
    jest.mock('../../src/logic/adoption-training-management', () => ({
      calculateSubmissionRate: mockCalculateSubmissionRate,
      calculateReportQualityScore: mockCalculateReportQualityScore,
      calculateFormatUnificationDegree: mockCalculateFormatUnificationDegree,
      verifyAdoptionReadiness: jest.requireActual('../../src/logic/adoption-training-management').verifyAdoptionReadiness,
    }));

    const result = verifyAdoptionReadiness(
      initialReportDataset,
      totalEngineerCount,
      submissionDeadline,
    );

    // Verify readiness status is 'ready'
    expect(result.readinessStatus).toBe('ready');

    // Verify verificationDate is a valid ISO 8601 format string
    expect(result.verificationDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Verify productionStartDate exists and is in ISO 8601 format
    expect(result.productionStartDate).toBeDefined();
    expect(result.productionStartDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Verify blockers field is either absent or an empty array
    if (result.blockers !== undefined) {
      expect(Array.isArray(result.blockers)).toBe(true);
      expect(result.blockers.length).toBe(0);
    }
  });
});