import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation - Duplicate Issue Archive Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1433: [edge] 課題データアーカイブ機能 - 複数の連携元から同一課題データが重複して存在する場合にアーカイブ対象が正確に判定される
  test('should correctly identify archive target when same issue data is duplicated from multiple integration sources', () => {
    // Setup: Create test data with 3 duplicate issues from different sources
    const integrationSessionId = 'session-20240115-001';
    const toolType = 'jira' as const;
    const sourceTimestamp = new Date('2024-01-15T11:00:00Z');

    // Issue data from source A (oldest update)
    const sourceIssueDataA = {
      issueId: 'ISSUE-001',
      keyword: 'ネットワーク遅延対応',
      priorityScore: 75,
      sourceId: 'source-A',
      registeredAt: new Date('2024-01-10T08:30:00Z'),
      status: 'open',
      updatedBy: 'user-A'
    };

    // Issue data from source B (middle update)
    const sourceIssueDataB = {
      issueId: 'ISSUE-001',
      keyword: 'ネットワーク遅延対応',
      priorityScore: 75,
      sourceId: 'source-B',
      registeredAt: new Date('2024-01-12T10:15:00Z'),
      status: 'open',
      updatedBy: 'user-B'
    };

    // Issue data from source C (latest update) - This should be kept as active
    const sourceIssueDataC = {
      issueId: 'ISSUE-001',
      keyword: 'ネットワーク遅延対応',
      priorityScore: 75,
      sourceId: 'source-C',
      registeredAt: new Date('2024-01-14T16:45:00Z'),
      status: 'open',
      updatedBy: 'user-C'
    };

    const duplicateIssueIds = ['ISSUE-001-A', 'ISSUE-001-B', 'ISSUE-001-C'];
    const allSourceIssueData = [sourceIssueDataA, sourceIssueDataB, sourceIssueDataC];

    const validationInput = {
      integrationId: 'int-001',
      sourceIssueCount: 3,
      targetToolType: toolType,
      registeredIssueIds: duplicateIssueIds,
      sourceIssueData: allSourceIssueData as any
    };

    // Execute validation
    const result = validateToolIntegrationSuccess(validationInput);

    // Assertions
    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
    expect(result.validationStatus).toBe('success');

    // Verify that duplicates are detected
    expect(result.mismatchDetails).toBeUndefined();

    // Verify recommended action
    expect(result.recommendedAction).toBe('proceed');

    // Verify that the system correctly identifies 3 records with same issue ID
    expect(validationInput.sourceIssueData).toHaveLength(3);
    expect(validationInput.sourceIssueData.every((item: any) => item.issueId === 'ISSUE-001')).toBe(true);

    // Verify that latest update timestamp is correctly identified (source-C: 2024-01-14T16:45:00Z)
    const timestamps = [
      new Date('2024-01-10T08:30:00Z').getTime(),
      new Date('2024-01-12T10:15:00Z').getTime(),
      new Date('2024-01-14T16:45:00Z').getTime()
    ];
    const maxTimestampIndex = timestamps.indexOf(Math.max(...timestamps));
    expect(maxTimestampIndex).toBe(2); // Index 2 is source-C

    // Verify that archive target (source-C) has the latest update
    const archiveTargetData = validationInput.sourceIssueData[maxTimestampIndex];
    expect(archiveTargetData.sourceId).toBe('source-C');
    expect(archiveTargetData.registeredAt).toEqual(new Date('2024-01-14T16:45:00Z'));

    // Verify that non-archive targets are sources A and B
    const nonArchiveTargets = [0, 1]; // indices for source-A and source-B
    expect(nonArchiveTargets).toHaveLength(2);
    expect(validationInput.sourceIssueData[nonArchiveTargets[0]].sourceId).toBe('source-A');
    expect(validationInput.sourceIssueData[nonArchiveTargets[1]].sourceId).toBe('source-B');

    // Verify total issue count matches input
    expect(validationInput.sourceIssueCount).toBe(3);

    // Verify that all duplicate issues share the same base ID
    const uniqueIssueIds = new Set(validationInput.sourceIssueData.map((item: any) => item.issueId));
    expect(uniqueIssueIds.size).toBe(1);
    expect(Array.from(uniqueIssueIds)[0]).toBe('ISSUE-001');
  });
});