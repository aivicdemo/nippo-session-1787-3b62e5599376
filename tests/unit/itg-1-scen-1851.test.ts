import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次課題傾向分析レポート生成', () => {
  let aiClientStub: Tx7Imp1AiClient;

  beforeEach(() => {
    aiClientStub = {
      buildAction01Prompt: jest.fn().mockReturnValue('mock-prompt-01'),
      buildAction02Prompt: jest.fn().mockReturnValue('mock-prompt-02'),
      buildAction03Prompt: jest.fn().mockReturnValue('mock-prompt-03'),
      buildAction04Prompt: jest.fn().mockReturnValue('mock-prompt-04'),
      buildAction05Prompt: jest.fn().mockReturnValue('mock-prompt-05'),
      buildAction06Prompt: jest.fn().mockReturnValue('mock-prompt-06'),
      buildAction07Prompt: jest.fn().mockReturnValue('mock-prompt-07'),
      buildAction08Prompt: jest.fn().mockReturnValue('mock-prompt-08'),
      callLLM: jest.fn().mockResolvedValue({
        content: 'mock-response',
        stopReason: 'end_turn'
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1851
  it('should throw ValidationError when managerUserId is empty string', async () => {
    const invalidInput: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2024-01',
      managerUserId: '',
      includeDetailedAnalysis: true
    };

    await expect(
      runTx7Imp1Agent(invalidInput, aiClientStub)
    ).rejects.toThrow(/部長ID/);
  });
});