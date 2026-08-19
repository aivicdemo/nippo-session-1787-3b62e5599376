import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { extractAuthContext, requireRole, ForbiddenError, NotFoundError, ValidationError } from './rbac';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.MAIN_TABLE || 'morning-report-system';

interface AuditLog {
  pk: string;
  sk: string;
  action: string;
  userId: string;
  timestamp: number;
  details: Record<string, unknown>;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  role: string;
  department?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  leaderUserId?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  createdByUserId: string;
}

interface UserTeamRelation {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  joinedAt: number;
  leftAt?: number;
  status: string;
  createdAt: number;
  updatedAt: number;
  createdByUserId: string;
}

interface MorningReport {
  id: string;
  teamId: string;
  reporterId: string;
  reportedAt: number;
  yesterdayAccomplishment: string;
  todayPlan: string;
  issuesAndConcerns?: string;
  priority?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  createdByUserId: string;
}

interface IssueKeyword {
  id: string;
  name: string;
  description?: string;
  teamId?: string;
  displayOrder?: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  createdByUserId: string;
}

interface ExtractedIssue {
  id: string;
  morningReportId: string;
  content: string;
  type: string;
  priority?: string;
  status: string;
  assignedTeamId?: string;
  assignedUserId?: string;
  extractedKeyword?: string;
  createdAt: number;
  updatedAt: number;
  createdByUserId: string;
}

interface IssuePriorityScore {
  id: string;
  extractedIssueId: string;
  priorityScore: number;
  urgency?: number;
  impact?: number;
  scoreCalculationMethod?: string;
  createdAt: number;
  updatedAt: number;
  createdByUserId: string;
}

interface ReportSubmissionStatus {
  id: string;
  userId: string;
  reportDate: number;
  submissionStatus: string;
  submittedAt?: number;
  morningReportId?: string;
  deadlineAt: number;
  isDelayed: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ReminderNotificationHistory {
  id: string;
  userId: string;
  morningReportId: string;
  notificationType: string;
  notificationMethod: string;
  sentAt: number;
  sendStatus: string;
  errorMessage?: string;
  createdAt: number;
  createdByUserId: string;
}

interface DashboardConfig {
  id: string;
  userId?: string;
  teamId?: string;
  configName: string;
  widgetDisplayConfig: string;
  layoutType: string;
  defaultPeriod: string;
  filterConditions?: string;
  autoRefreshIntervalSeconds: number;
  isDefaultConfig: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  createdByUserId: string;
}

type TableType = 'users' | 'teams' | 'userTeamRelations' | 'morningReports' | 'issueKeywords' | 'extractedIssues' | 'issuePriorityScores' | 'reportSubmissionStatuses' | 'reminderNotificationHistories' | 'dashboardConfigs';

const TABLE_INDICES: Record<number, TableType> = {
  0: 'users',
  1: 'teams',
  2: 'userTeamRelations',
  3: 'morningReports',
  4: 'issueKeywords',
  5: 'extractedIssues',
  6: 'issuePriorityScores',
  7: 'reportSubmissionStatuses',
  8: 'reminderNotificationHistories',
  9: 'dashboardConfigs'
};

function getTablePrefix(tableType: TableType): string {
  const prefixes: Record<TableType, string> = {
    users: 'USER',
    teams: 'TEAM',
    userTeamRelations: 'UTR',
    morningReports: 'MR',
    issueKeywords: 'IK',
    extractedIssues: 'EI',
    issuePriorityScores: 'IPS',
    reportSubmissionStatuses: 'RSS',
    reminderNotificationHistories: 'RNH',
    dashboardConfigs: 'DC'
  };
  return prefixes[tableType];
}

async function writeAuditLog(action: string, userId: string, details: Record<string, unknown>): Promise<void> {
  const auditLog: AuditLog = {
    pk: 'AUDIT',
    sk: `${Date.now()}#${randomUUID()}`,
    action,
    userId,
    timestamp: Date.now(),
    details
  };
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: auditLog
  }));
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

async function handleGetResources(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'attribute_exists(pk) AND pk <> :audit',
      ExpressionAttributeValues: {
        ':audit': 'AUDIT'
      },
      Limit: 100
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Items || [],
        count: result.Items?.length || 0
      })
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleBulkImport(event: APIGatewayProxyEvent, tableIndex: number): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin', 'operator']);

    const tableType = TABLE_INDICES[tableIndex];
    if (!tableType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid table index' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Items must be a non-empty array' })
      };
    }

    const prefix = getTablePrefix(tableType);
    const now = Date.now();
    const processedItems: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const processedItem = {
          ...item,
          pk: `${prefix}#${item.id || randomUUID()}`,
          sk: `${prefix}#${item.id || randomUUID()}`,
          id: item.id || randomUUID(),
          createdAt: item.createdAt || now,
          updatedAt: item.updatedAt || now
        };
        processedItems.push(processedItem);
      } catch (err) {
        errors.push(`Item ${i}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    let imported = 0;
    let failed = 0;

    for (let i = 0; i < processedItems.length; i += 25) {
      const batch = processedItems.slice(i, i + 25);
      const writeRequests = batch.map(item => ({
        PutRequest: {
          Item: item
        }
      }));

      try {
        await docClient.send(new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: writeRequests
          }
        }));
        imported += batch.length;
      } catch (err) {
        failed += batch.length;
        errors.push(`Batch write failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    await writeAuditLog('BULK_IMPORT', authContext.userId, {
      tableType,
      imported,
      failed,
      totalRequested: items.length
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        imported,
        failed,
        errors: errors.length > 0 ? errors : undefined
      })
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleGetUsers(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin', 'operator', 'viewer']);

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': 'USER'
      },
      Limit: 100
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Items || [],
        count: result.Items?.length || 0
      })
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleGetUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin', 'operator', 'viewer']);

    const userId = event.pathParameters?.id;
    if (!userId || !validateUUID(userId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid user ID' })
      };
    }

    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `USER#${userId}`
      }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: 'User not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Item
      })
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleCreateUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin']);

    const body = JSON.parse(event.body || '{}');
    const { username, displayName, email, passwordHash, role, department, isActive } = body;

    if (!username || !displayName || !email || !passwordHash || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing required fields' })
      };
    }

    if (!validateEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid email format' })
      };
    }

    const userId = randomUUID();
    const now = Date.now();
    const user: User = {
      id: userId,
      username,
      displayName,
      email,
      passwordHash,
      role,
      department,
      isActive: isActive !== false,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `USER#${userId}`,
        ...user
      }
    }));

    await writeAuditLog('CREATE_USER', authContext.userId, { userId, username, email });

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        data: user
      })
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleUpdateUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin']);

    const userId = event.pathParameters?.id;
    if (!userId || !validateUUID(userId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid user ID' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { displayName, email, role, department, isActive } = body;

    if (email && !validateEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid email format' })
      };
    }

    const updateExpression: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};

    if (displayName !== undefined) {
      updateExpression.push('displayName = :displayName');
      expressionAttributeValues[':displayName'] = displayName;
    }
    if (email !== undefined) {
      updateExpression.push('email = :email');
      expressionAttributeValues[':email'] = email;
    }
    if (role !== undefined) {
      updateExpression.push('role = :role');
      expressionAttributeValues[':role'] = role;
    }
    if (department !== undefined) {
      updateExpression.push('department = :department');
      expressionAttributeValues[':department'] = department;
    }
    if (isActive !== undefined) {
      updateExpression.push('isActive = :isActive');
      expressionAttributeValues[':isActive'] = isActive;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = Date.now();

    if (updateExpression.length === 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'No fields to update' })
      };
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `USER#${userId}`
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    await writeAuditLog('UPDATE_USER', authContext.userId, { userId, updates: body });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Attributes
      })
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleDeleteUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin']);

    const userId = event.pathParameters?.id;
    if (!userId || !validateUUID(userId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid user ID' })
      };
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `USER#${userId}`
      }
    }));

    await writeAuditLog('DELETE_USER', authContext.userId, { userId });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'User deleted successfully'
      })
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleGetTeams(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin', 'operator', 'viewer']);

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': 'TEAM'
      },
      Limit: 100
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Items || [],
        count: result.Items?.length || 0
      })
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleGetTeam(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin', 'operator', 'viewer']);

    const teamId = event.pathParameters?.id;
    if (!teamId || !validateUUID(teamId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid team ID' })
      };
    }

    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `TEAM#${teamId}`,
        sk: `TEAM#${teamId}`
      }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: 'Team not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Item
      })
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleCreateTeam(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin', 'operator']);

    const body = JSON.parse(event.body || '{}');
    const { name, description, leaderUserId, status } = body;

    if (!name || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing required fields' })
      };
    }

    const teamId = randomUUID();
    const now = Date.now();
    const team: Team = {
      id: teamId,
      name,
      description,
      leaderUserId,
      status,
      createdAt: now,
      updatedAt: now,
      createdByUserId: authContext.userId
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `TEAM#${teamId}`,
        sk: `TEAM#${teamId}`,
        ...team
      }
    }));

    await writeAuditLog('CREATE_TEAM', authContext.userId, { teamId, name });

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        data: team
      })
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleUpdateTeam(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin', 'operator']);

    const teamId = event.pathParameters?.id;
    if (!teamId || !validateUUID(teamId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid team ID' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { name, description, leaderUserId, status } = body;

    const updateExpression: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};

    if (name !== undefined) {
      updateExpression.push('name = :name');
      expressionAttributeValues[':name'] = name;
    }
    if (description !== undefined) {
      updateExpression.push('description = :description');
      expressionAttributeValues[':description'] = description;
    }
    if (leaderUserId !== undefined) {
      updateExpression.push('leaderUserId = :leaderUserId');
      expressionAttributeValues[':leaderUserId'] = leaderUserId;
    }
    if (status !== undefined) {
      updateExpression.push('status = :status');
      expressionAttributeValues[':status'] = status;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = Date.now();

    if (updateExpression.length === 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'No fields to update' })
      };
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `TEAM#${teamId}`,
        sk: `TEAM#${teamId}`
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    await writeAuditLog('UPDATE_TEAM', authContext.userId, { teamId, updates: body });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Attributes
      })
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleDeleteTeam(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin']);

    const teamId = event.pathParameters?.id;
    if (!teamId || !validateUUID(teamId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid team ID' })
      };
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `TEAM#${teamId}`,
        sk: `TEAM#${teamId}`
      }
    }));

    await writeAuditLog('DELETE_TEAM', authContext.userId, { teamId });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Team deleted successfully'
      })
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleGetMorningReports(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin', 'operator', 'viewer']);

    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': 'MR'
      },
      Limit: 100
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Items || [],
        count: result.Items?.length || 0
      })
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleGetMorningReport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin', 'operator', 'viewer']);

    const reportId = event.pathParameters?.id;
    if (!reportId || !validateUUID(reportId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid report ID' })
      };
    }

    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `MR#${reportId}`,
        sk: `MR#${reportId}`
      }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: 'Morning report not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Item
      })
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleCreateMorningReport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin', 'operator']);

    const body = JSON.parse(event.body || '{}');
    const { teamId, reporterId, yesterdayAccomplishment, todayPlan, issuesAndConcerns, priority, status } = body;

    if (!teamId || !reporterId || !yesterdayAccomplishment || !todayPlan || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing required fields' })
      };
    }

    if (!validateUUID(teamId) || !validateUUID(reporterId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid team ID or reporter ID' })
      };
    }

    const reportId = randomUUID();
    const now = Date.now();
    const report: MorningReport = {
      id: reportId,
      teamId,
      reporterId,
      reportedAt: now,
      yesterdayAccomplishment,
      todayPlan,
      issuesAndConcerns,
      priority,
      status,
      createdAt: now,
      updatedAt: now,
      createdByUserId: authContext.userId
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `MR#${reportId}`,
        sk: `MR#${reportId}`,
        ...report
      }
    }));

    await writeAuditLog('CREATE_MORNING_REPORT', authContext.userId, { reportId, teamId, reporterId });

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        data: report
      })
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleUpdateMorningReport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin', 'operator']);

    const reportId = event.pathParameters?.id;
    if (!reportId || !validateUUID(reportId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid report ID' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { yesterdayAccomplishment, todayPlan, issuesAndConcerns, priority, status } = body;

    const updateExpression: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};

    if (yesterdayAccomplishment !== undefined) {
      updateExpression.push('yesterdayAccomplishment = :yesterdayAccomplishment');
      expressionAttributeValues[':yesterdayAccomplishment'] = yesterdayAccomplishment;
    }
    if (todayPlan !== undefined) {
      updateExpression.push('todayPlan = :todayPlan');
      expressionAttributeValues[':todayPlan'] = todayPlan;
    }
    if (issuesAndConcerns !== undefined) {
      updateExpression.push('issuesAndConcerns = :issuesAndConcerns');
      expressionAttributeValues[':issuesAndConcerns'] = issuesAndConcerns;
    }
    if (priority !== undefined) {
      updateExpression.push('priority = :priority');
      expressionAttributeValues[':priority'] = priority;
    }
    if (status !== undefined) {
      updateExpression.push('status = :status');
      expressionAttributeValues[':status'] = status;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = Date.now();

    if (updateExpression.length === 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'No fields to update' })
      };
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `MR#${reportId}`,
        sk: `MR#${reportId}`
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    await writeAuditLog('UPDATE_MORNING_REPORT', authContext.userId, { reportId, updates: body });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Attributes
      })
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

async function handleDeleteMorningReport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const authContext = extractAuthContext(event);
    requireRole(authContext, ['admin']);

    const reportId = event.pathParameters?.id;
    if (!reportId || !validateUUID(reportId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid report ID' })
      };
    }

    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `MR#${reportId}`,
        sk: `MR#${reportId}`
      }
    }));

    await writeAuditLog('DELETE_MORNING_REPORT', authContext.userId, { reportId });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Morning report deleted successfully'
      })
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
    if (error instanceof Error && error.message.includes('Missing authorization')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path || '';
  const method = event.httpMethod || 'GET';

  try {
    if (path === '/resources' && method === 'GET') {
      return await handleGetResources(event);
    }

    const bulkMatch = path.match(/^\/api\/(\d+)\/bulk$/);
    if (bulkMatch && method === 'POST') {
      const tableIndex = parseInt(bulkMatch[1], 10);
      return await handleBulkImport(event, tableIndex);
    }

    if (path === '/users' && method === 'GET') {
      return await handleGetUsers(event);
    }
    if (path === '/users' && method === 'POST') {
      return await handleCreateUser(event);
    }
    if (path.match(/^\/users\/[a-f0-9-]+$/) && method === 'GET') {
      return await handleGetUser(event);
    }
    if (path.match(/^\/users\/[a-f0-9-]+$/) && method === 'PUT') {
      return await handleUpdateUser(event);
    }
    if (path.match(/^\/users\/[a-f0-9-]+$/) && method === 'DELETE') {
      return await handleDeleteUser(event);
    }

    if (path === '/teams' && method === 'GET') {
      return await handleGetTeams(event);
    }
    if (path === '/teams' && method === 'POST') {
      return await handleCreateTeam(event);
    }
    if (path.match(/^\/teams\/[a-f0-9-]+$/) && method === 'GET') {
      return await handleGetTeam(event);
    }
    if (path.match(/^\/teams\/[a-f0-9-]+$/) && method === 'PUT') {
      return await handleUpdateTeam(event);
    }
    if (path.match(/^\/teams\/[a-f0-9-]+$/) && method === 'DELETE') {
      return await handleDeleteTeam(event);
    }

    if (path === '/morning-reports' && method === 'GET') {
      return await handleGetMorningReports(event);
    }
    if (path === '/morning-reports' && method === 'POST') {
      return await handleCreateMorningReport(event);
    }
    if (path.match(/^\/morning-reports\/[a-f0-9-]+$/) && method === 'GET') {
      return await handleGetMorningReport(event);
    }
    if (path.match(/^\/morning-reports\/[a-f0-9-]+$/) && method === 'PUT') {
      return await handleUpdateMorningReport(event);
    }
    if (path.match(/^\/morning-reports\/[a-f0-9-]+$/) && method === 'DELETE') {
      return await handleDeleteMorningReport(event);
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ success: false, error: 'Not found' })
    };
  } catch (error) {
    console.error('Unhandled error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
};