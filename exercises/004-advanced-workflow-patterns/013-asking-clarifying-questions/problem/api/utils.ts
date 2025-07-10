import type { UIMessage } from "ai";

export const formatMessageHistory = (messages: UIMessage[]) => {
  return messages
    .map((message) => {
      return `${message.role}: ${message.parts
        .map((part) => {
          if (part.type === "text") {
            return part.text;
          }

          return "";
        })
        .join("")}`;
    })
    .join("\n");
};

export const WRITE_SLACK_MESSAGE_FIRST_DRAFT_SYSTEM = `You are writing a Slack message for a user based on the conversation history. Only return the Slack message, no other text.`;
export const EVALUATE_SLACK_MESSAGE_SYSTEM = `You are evaluating the Slack message produced by the user.

  Evaluation criteria:
  - The Slack message should be written in a way that is easy to understand.
  - It should be appropriate for a professional Slack conversation.
`;
export const CHECK_FOR_CLARIFYING_QUESTIONS_SYSTEM = `You are checking to see if a Slack message draft requires any clarifying questions.
  Specifically, ask about names, dates, and other details that are not obvious from the conversation history.
  Do not ask for advice about the draft.
  If we have all the basic information we need, do not ask for more information.
  Asking for information too many times is annoying.
`;

export type MyMessage = UIMessage<
  unknown,
  {
    "slack-message": string;
    "slack-message-feedback": string;
  }
>;

export class LoopContext {
  step = 0;
  mostRecentDraft = "";
  previousFeedback = "";

  shouldStop() {
    return this.step > 2;
  }

  private messages: UIMessage[];

  constructor(messages: UIMessage[]) {
    this.messages = messages;
  }

  formatMessageHistory(): string {
    return this.messages
      .map((message) => {
        return `${message.role}: ${message.parts
          .map((part) => {
            if (part.type === "text") {
              return part.text;
            }

            return "";
          })
          .join("")}`;
      })
      .join("\n");
  }
}
