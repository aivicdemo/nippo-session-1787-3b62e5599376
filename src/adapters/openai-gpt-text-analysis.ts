import { randomUUID } from "crypto";

export interface KeywordExtractionResult {
  keywords: Array<{
    keyword: string;
    frequency: number;
  }>;
  totalKeywordsFound: number;
}

export interface ImpactAssessmentResult {
  keyword: string;
  teamWaveImpactScore: number;
  confidence: number;
}

export interface IssueSeverityClassification {
  text: string;
  severity: "high" | "medium" | "low";
  reasoning: string;
}

export interface TextAnalysisServiceAdapter {
  extractKeywords(dailyReportText: string): Promise<KeywordExtractionResult>;
  assessImpactScore(
    keywords: string[]
  ): Promise<ImpactAssessmentResult[]>;
  classifyIssueSeverity(
    issueText: string
  ): Promise<IssueSeverityClassification>;
}

interface OpenAIConfig {
  apiKey: string;
  orgId: string;
  modelId: string;
  requestTimeoutMs: number;
  maxTokens: number;
  temperature: number;
  hardwarePasskeyEnabled: boolean;
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

const RETRY_INTERVALS_MS = [3000, 10000, 30000];
const MAX_RETRIES = 3;

async function callOpenAIAPI(
  config: OpenAIConfig,
  messages: OpenAIMessage[]
): Promise<string> {
  const endpoint = "https://api.openai.com/v1/chat/completions";

  const requestBody = {
    model: config.modelId,
    messages: messages,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.requestTimeoutMs
      );

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          "OpenAI-Organization": config.orgId,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data: OpenAIResponse = await response.json();

      if (
        !data.choices ||
        data.choices.length === 0 ||
        !data.choices[0].message
      ) {
        throw new Error("Invalid OpenAI API response format");
      }

      return data.choices[0].message.content;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error(String(error));

      if (attempt < MAX_RETRIES - 1) {
        const delayMs = RETRY_INTERVALS_MS[attempt];
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `Failed to call OpenAI API after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

export function loadOpenAIConfigFromEnv(): OpenAIConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  const orgId = process.env.OPENAI_ORG_ID;
  const modelId = process.env.OPENAI_MODEL_ID;
  const requestTimeoutMs = process.env.OPENAI_REQUEST_TIMEOUT_MS;
  const maxTokens = process.env.OPENAI_MAX_TOKENS;
  const temperature = process.env.OPENAI_TEMPERATURE;
  const hardwarePasskeyEnabled = process.env.HARDWARE_PASSKEY_ENABLED;

  const missingVars: string[] = [];

  if (!apiKey) missingVars.push("OPENAI_API_KEY");
  if (!orgId) missingVars.push("OPENAI_ORG_ID");
  if (!modelId) missingVars.push("OPENAI_MODEL_ID");
  if (!requestTimeoutMs) missingVars.push("OPENAI_REQUEST_TIMEOUT_MS");
  if (!maxTokens) missingVars.push("OPENAI_MAX_TOKENS");
  if (temperature === undefined) missingVars.push("OPENAI_TEMPERATURE");
  if (hardwarePasskeyEnabled === undefined)
    missingVars.push("HARDWARE_PASSKEY_ENABLED");

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  return {
    apiKey: apiKey!,
    orgId: orgId!,
    modelId: modelId!,
    requestTimeoutMs: parseInt(requestTimeoutMs!, 10),
    maxTokens: parseInt(maxTokens!, 10),
    temperature: parseFloat(temperature!),
    hardwarePasskeyEnabled: hardwarePasskeyEnabled === "true",
  };
}

export function createOpenAIGPTTextAnalysisAdapter(
  config: OpenAIConfig
): TextAnalysisServiceAdapter {
  return {
    async extractKeywords(
      dailyReportText: string
    ): Promise<KeywordExtractionResult> {
      const messages: OpenAIMessage[] = [
        {
          role: "system",
          content:
            "You are an expert at extracting keywords from daily reports. Extract the main issue keywords and count their frequency. Return a JSON object with keywords array containing objects with 'keyword' and 'frequency' fields.",
        },
        {
          role: "user",
          content: `Extract keywords from this daily report:\n\n${dailyReportText}\n\nReturn JSON format: {"keywords": [{"keyword": "...", "frequency": number}]}`,
        },
      ];

      const responseText = await callOpenAIAPI(config, messages);

      let parsedResponse;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (error) {
        throw new Error(
          `Failed to parse OpenAI response as JSON: ${responseText}`
        );
      }

      if (
        !parsedResponse.keywords ||
        !Array.isArray(parsedResponse.keywords)
      ) {
        throw new Error("Invalid response format: keywords array not found");
      }

      const keywords = parsedResponse.keywords.map(
        (item: { keyword: string; frequency: number }) => ({
          keyword: item.keyword,
          frequency: item.frequency,
        })
      );

      return {
        keywords,
        totalKeywordsFound: keywords.length,
      };
    },

    async assessImpactScore(
      keywords: string[]
    ): Promise<ImpactAssessmentResult[]> {
      const messages: OpenAIMessage[] = [
        {
          role: "system",
          content:
            "You are an expert at assessing the impact of issues on teams. For each keyword, provide a team wave impact score from 0-100 and a confidence level. Return a JSON array.",
        },
        {
          role: "user",
          content: `Assess the team wave impact for these keywords: ${keywords.join(", ")}\n\nReturn JSON format: [{"keyword": "...", "teamWaveImpactScore": number (0-100), "confidence": number (0-1)}]`,
        },
      ];

      const responseText = await callOpenAIAPI(config, messages);

      let parsedResponse;
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error("No JSON array found in response");
        }
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (error) {
        throw new Error(
          `Failed to parse OpenAI response as JSON: ${responseText}`
        );
      }

      if (!Array.isArray(parsedResponse)) {
        throw new Error("Invalid response format: expected JSON array");
      }

      return parsedResponse.map(
        (item: {
          keyword: string;
          teamWaveImpactScore: number;
          confidence: number;
        }) => ({
          keyword: item.keyword,
          teamWaveImpactScore: item.teamWaveImpactScore,
          confidence: item.confidence,
        })
      );
    },

    async classifyIssueSeverity(
      issueText: string
    ): Promise<IssueSeverityClassification> {
      const messages: OpenAIMessage[] = [
        {
          role: "system",
          content:
            "You are an expert at classifying issue severity. Classify issues as high, medium, or low severity. Return a JSON object with severity and reasoning.",
        },
        {
          role: "user",
          content: `Classify the severity of this issue:\n\n${issueText}\n\nReturn JSON format: {"severity": "high" | "medium" | "low", "reasoning": "..."}`,
        },
      ];

      const responseText = await callOpenAIAPI(config, messages);

      let parsedResponse;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (error) {
        throw new Error(
          `Failed to parse OpenAI response as JSON: ${responseText}`
        );
      }

      if (
        !parsedResponse.severity ||
        !["high", "medium", "low"].includes(parsedResponse.severity)
      ) {
        throw new Error("Invalid severity value in response");
      }

      if (!parsedResponse.reasoning) {
        throw new Error("Missing reasoning in response");
      }

      return {
        text: issueText,
        severity: parsedResponse.severity,
        reasoning: parsedResponse.reasoning,
      };
    },
  };
}
