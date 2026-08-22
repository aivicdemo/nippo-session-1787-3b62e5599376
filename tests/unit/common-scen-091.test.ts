import { getDashboardData } from '../../src/logic/dashboard-display';

describe('dashboard-display', () => {
  test('SCEN-091: Action 1 validates extracted issue data format and content', async () => {
    const extracted_issue_data = {
      id: 'issue-001',
      title: 'Database connection timeout during peak hours',
      description: 'Connection pool exhaustion observed between 10:00-11:00 JST',
      source: 'daily_report',
      extractedAt: '2024-01-15T09:30:00Z',
      severity_hint: 'high',
      category_hint: ['infrastructure', 'database']
    };

    const mock_ai_client = {
      callAction01ValidateExtractedData: jest.fn().mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
        validatedAt: '2024-01-15T09:35:00Z',
        action_version: '1.0.0'
      }),
      callAction02JudgePriorityCategory: jest.fn(),
      callAction03ExecuteToolIntegration: jest.fn(),
      callAction04RecordIntegrationStatus: jest.fn(),
      callAction05NotifyCompletion: jest.fn(),
      callAction06HandleEscalation: jest.fn(),
      callAction07ArchiveState: jest.fn()
    };

    const result = await getDashboardData(extracted_issue_data, mock_ai_client);

    expect(mock_ai_client.callAction01ValidateExtractedData).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'issue-001',
        title: 'Database connection timeout during peak hours',
        description: 'Connection pool exhaustion observed between 10:00-11:00 JST',
        source: 'daily_report',
        extractedAt: '2024-01-15T09:30:00Z',
        severity_hint: 'high',
        category_hint: ['infrastructure', 'database']
      })
    );

    expect(result).toEqual(
      expect.objectContaining({
        validation_status: 'completed',
        valid: true,
        errors: [],
        warnings: [],
        action_01_executed: true,
        action_01_version: '1.0.0',
        issue_id: 'issue-001',
        validated_at: '2024-01-15T09:35:00Z'
      })
    );

    expect(result.validation_status).toBe('completed');
    expect(result.valid).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});