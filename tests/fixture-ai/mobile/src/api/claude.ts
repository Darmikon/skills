// Called from the app's chat screen.
const KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? "sk-ant-api03-FAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE0000";

export async function ask(question: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 512, messages: [{ role: "user", content: question }] }),
  });
  return res.json();
}
