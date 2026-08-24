import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation - Archive Logic', () => {
  const FIXED_NOW = new Date('2026-09-15T09:00:00Z');
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  
  let originalDateNow: () => number;

  beforeEach(() => {
    originalDateNow = Date.now;
    Date.now = jest.fn(() => FIXED_NOW.getTime());
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  // SCEN-1428
  test('課題データアーカイブ機能 - 月末日にちょうど30日を経過したデータがアーカイブ対象として判定される', () => {
    const createdAtDataA = new Date('2026-08-16T09:00:00Z');
    const createdAtDataB = new Date('2026-08-15T09:00:00Z');
    const createdAtDataC = new Date('2026-08-14T09:00:00Z');

    const sourceIssueDataArray = [
      {
        issueId: 'ISSUE-001',
        keyword: 'database_connection',
        priorityScore: 45,
        createdAt: createdAtDataA,
      },
      {
        issueId: 'ISSUE-002',
        keyword: 'memory_leak',
        priorityScore: 78,
        createdAt: createdAtDataB,
      },
      {
        issueId: 'ISSUE-003',
        keyword: 'ui_rendering',
        priorityScore: 62,
        createdAt: createdAtDataC,
      },
    ];

    const integrationSessionId = 'SESSION-20260915-001';
    const toolType = 'jira' as const;
    const extractedIssueCount = 3;
    const integrationTimestamp = FIXED_NOW;
    const registeredIssueIds = ['ISSUE-001', 'ISSUE-002', 'ISSUE-003'];

    const result = validateToolIntegrationSuccess({
      integrationSessionId,
      toolType,
      extractedIssueCount,
      integrationTimestamp,
      sourceIssueData: sourceIssueDataArray,
      registeredIssueIds,
    });

    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
    expect(result.validationStatus).toBe('success');
    expect(result.mismatchDetails).toBeUndefined();
    expect(result.recommendedAction).toBe('proceed');

    const archiveThresholdTime = FIXED_NOW.getTime() - THIRTY_DAYS_MS;
    const dataATime = createdAtDataA.getTime();
    const dataBTime = createdAtDataB.getTime();
    const dataCTime = createdAtDataC.getTime();

    expect(dataATime).toBeLessThanOrEqual(archiveThresholdTime);
    expect(dataBTime).toBeLessThan(archiveThresholdTime);
    expect(dataCTime).toBeLessThan(archiveThresholdTime);

    expect(createdAtDataA.toISOString()).toBe('2026-08-16T09:00:00.000Z');
    expect(createdAtDataB.toISOString()).toBe('2026-08-15T09:00:00.000Z');
    expect(createdAtDataC.toISOString()).toBe('2026-08-14T09:00:00.000Z');
  });
});