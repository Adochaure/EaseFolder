type GrokMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GrokCompletionResult = {
  content: string;
  rawResponse: Response;
};

export async function callGrok(messages: GrokMessage[]): Promise<GrokCompletionResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const response = await fetch(
    process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok request failed with status ${response.status}: ${errorText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Grok returned an empty response.");
  }

  return {
    content,
    rawResponse: response,
  };
}
