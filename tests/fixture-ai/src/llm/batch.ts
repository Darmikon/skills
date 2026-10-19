import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Labels each review as positive or negative.
export async function labelReviews(reviews: string[]): Promise<string[]> {
  const resps = await Promise.all(
    reviews.map((text) =>
      client.messages.create({
        model: "claude-sonnet-5-5",
        max_tokens: 4096,
        messages: [{ role: "user", content: `Positive or negative? Answer with one word.\n\n${text}` }],
      }),
    ),
  );
  return resps.map((r) => {
    const block = r.content[0];
    return block.type === "text" ? block.text : "";
  });
}
