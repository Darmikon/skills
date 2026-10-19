import type Anthropic from "@anthropic-ai/sdk";
import { refundOrder } from "../services/orders.ts";

const TOOLS: Record<string, (input: any) => unknown> = {
  refund: (input) => refundOrder(input.orderId),
};

// Runs a tool the model asked for and returns its result to the model.
export async function runTool(use: Anthropic.ToolUseBlock): Promise<Anthropic.ToolResultBlockParam> {
  try {
    const result = await TOOLS[use.name](use.input);
    return { type: "tool_result", tool_use_id: use.id, content: JSON.stringify(result) };
  } catch {
    return { type: "tool_result", tool_use_id: use.id, content: "" };
  }
}
