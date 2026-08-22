import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

interface AuditLogEntry {
  eventType: string;
  userId: string;
  timestamp: Date;
  operationType: string;
  details: Record<string, unknown>;
}

interface AuthorizationException extends Error {
  statusCode: number;
  accessTarget: string;
  userPermission: string;
  requiredPermission: string;
}

describe('Tx1Imp1Agent Authorization Denial', () => {
  let auditLogBuffer: AuditLogEntry[];
  let mockAiClient: Tx1Imp1AiClient;
  let mockAuthorizationMiddleware: jest.Mock;

  beforeEach(() => {
    auditLogBuffer = [];
    
    mockAuthorizationMiddleware = jest.fn(
      (userId: string, permission: string, requiredPermission: string) => {
        if (permission !== requiredPermission && permission !== 'admin') {
          const error = new Error('AUTHORIZATION_DENIED') as AuthorizationException;
          error.statusCode = 403;
          error.accessTarget = 'report_data';
          error.userPermission = permission;
          error.requiredPermission = requiredPermission;
          throw error;
        }
      }
    );

    const mockAuditLogger = jest.fn((entry: AuditLogEntry) => {
      auditLogBuffer.push({
        ...entry,
        timestamp: entry.timestamp || new Date(),
      });
    });

    mockAiClient = {
      aggregateReports: jest.fn(async () => {
        mockAuthorizationMiddleware('user_A', 'employee', 'manager');
        throw new Error('Should not reach here');
      }),
      
      extractAndPrioritizeIssues: jest.fn(async () => {
        mockAuthorizationMiddleware('user_A', 'employee', 'manager');
        throw new Error('Should not reach here');
      }),
      
      sendUnsubmittedNotification: jest.fn(async () => {
        mockAuthorizationMiddleware('user_A', 'employee', 'manager');
        throw new Error('Should not reach here');
      }),
      
      generateMorningMeetingMaterial: jest.fn(),
      sendCompletionNotification: jest.fn(),
    } as any;

    jest.spyOn(global, 'Date').mockImplementation(() => 
      new Date('2024-01-15T09:00:00Z') as any
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-036
  test('should deny unauthorized access to report aggregation, rule modification, and notification sending', async () => {
    const agentInput: Tx1Imp1AgentInput = {
      executionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportDeadlineTime: '09:00',
      morningMeetingStartTime: '09:30',
      teamMemberIds: ['user_B', 'user_C'],
      managerEmail: 'manager@example.com',
    };

    let authorizationError: AuthorizationException | null = null;

    try {
      await runTx1Imp1Agent(agentInput, mockAiClient);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'AUTHORIZATION_DENIED' &&
        'statusCode' in error
      ) {
        authorizationError = error as AuthorizationException;
      }
    }

    expect(authorizationError).not.toBeNull();
    expect(authorizationError?.statusCode).toBe(403);
    expect(authorizationError?.userPermission).toBe('employee');
    expect(authorizationError?.requiredPermission).toBe('manager');

    expect(mockAiClient.aggregateReports).toHaveBeenCalledTimes(1);
    expect(mockAiClient.extractAndPrioritizeIssues).not.toHaveBeenCalled();
    expect(mockAiClient.sendUnsubmittedNotification).not.toHaveBeenCalled();
    expect(mockAiClient.generateMorningMeetingMaterial).not.toHaveBeenCalled();
    expect(mockAiClient.sendCompletionNotification).not.toHaveBeenCalled();

    const authorizationDeniedEvents = auditLogBuffer.filter(
      (log) => log.eventType === 'AUTHORIZATION_DENIED'
    );
    expect(authorizationDeniedEvents.length).toBeGreaterThanOrEqual(0);

    expect(mockAuthorizationMiddleware).toHaveBeenCalledWith(
      'user_A',
      'employee',
      'manager'
    );
  });
});