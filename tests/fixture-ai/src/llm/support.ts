import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Answers a customer's question about an order.
export async function askSupport(question: string): Promise<string> {
  let resp: Anthropic.Message | undefined;
  for (let i = 0; i < 5; i++) {
    try {
      resp = await client.messages.create({
        model: "claude-sonnet-5-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: question }],
      });
      break;
    } catch (e) {
      await sleep(0);
    }
  }
  const block = resp!.content[0];
  return block.type === "text" ? block.text : "";
}
