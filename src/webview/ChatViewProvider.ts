import * as vscode from "vscode";
import { BaseViewProvider } from "./BaseViewProvider";
import { ProviderManager } from "../providers/ProviderManager";
import { ChatMessage } from "../providers/BaseProvider";

interface UIMessage extends ChatMessage {
  id: string;
  timestamp: number;
  status?: "sending" | "error" | "received";
  error?: string;
}

interface ConversationContext {
  fileContext?: {
    path: string;
    language: string;
    content: string;
  };
  selectionContext?: {
    text: string;
    startLine: number;
    endLine: number;
  };
}

export class ChatViewProvider extends BaseViewProvider {
  private messages: UIMessage[] = [];
  private currentContext: ConversationContext | null = null;

  protected getHtmlContent(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    const styleUri = this.getUri(webview, "media", "styles", "chat.css");
    const scriptUri = this.getUri(webview, "media", "scripts", "chat.js");

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <link href="${styleUri}" rel="stylesheet">
        <title>AI Chat</title>
    </head>
    <body>
        <div id="chat-container">
            <div id="chat-header">
                <div id="provider-info"></div>
                <div id="model-info"></div>
                <div id="context-info"></div>
            </div>
            <div id="messages"></div>
            <div id="suggestions">
                <div class="suggestion-header">Suggested Questions</div>
                <div id="suggestion-list"></div>
            </div>
            <div id="input-container">
                <div id="message-box">
                    <textarea
                        id="message-input"
                        placeholder="Type your message or use voice input (Ctrl+Shift+V)..."
                        rows="3"
                        maxlength="4000"
                    ></textarea>
                    <div id="input-actions">
                        <button id="clear-button" title="Clear chat">🗑️</button>
                        <button id="voice-button" title="Voice input (Ctrl+Shift+V)">🎤</button>
                        <button id="copy-button" title="Copy last response">📋</button>
                        <button id="context-button" title="Add file context">📄</button>
                    </div>
                </div>
                <div id="button-container">
                    <button id="send-button" class="primary">Send</button>
                    <button id="stop-button" class="danger" style="display: none;">Stop</button>
                </div>
            </div>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  protected setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: { type: string; content?: any }) => {
        switch (message.type) {
          case "sendMessage":
            if (message.content) {
              await this.handleUserMessage(message.content);
            }
            break;
          case "clearChat":
            this.clearChat();
            break;
          case "copyLastResponse":
            this.copyLastResponse();
            break;
          case "addFileContext":
            await this.addFileContext();
            break;
          case "removeContext":
            this.removeContext();
            break;
          case "initialize":
            await this.initializeChat();
            break;
          case "useSuggestion":
            if (message.content) {
              await this.handleUserMessage(message.content);
            }
            break;
        }
      },
      undefined,
      this._disposables
    );
  }

  private async handleUserMessage(content: string) {
    const userMessage: UIMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    this.messages.push(userMessage);
    await this.sendMessageToWebview("addMessage", userMessage);

    try {
      const providerManager = ProviderManager.getInstance();
      const activeProvider = providerManager.getActiveProvider();
      const activeModel = providerManager.getActiveModel();

      if (!activeProvider) {
        throw new Error(
          "No AI provider configured. Please configure a provider in settings."
        );
      }

      if (!activeModel) {
        throw new Error(
          "No model selected. Please select a model in settings."
        );
      }

      const assistantMessage: UIMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        status: "sending",
      };

      this.messages.push(assistantMessage);
      await this.sendMessageToWebview("addMessage", assistantMessage);

      const context = this.buildContext();
      const response = await activeProvider.chat({
        messages: this.messages
          .filter((m) => !m.status || m.status === "received")
          .map((m) => ({
            role: m.role,
            content: m.content,
          })),
        context: context,
      });

      assistantMessage.content = response.message.content;
      assistantMessage.status = "received";

      await this.sendMessageToWebview("updateMessage", assistantMessage);
      await this.generateSuggestions(response.message.content);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      const assistantMessage: UIMessage = {
        id: `${Date.now()}-error`,
        role: "assistant",
        content: errorMessage,
        timestamp: Date.now(),
        status: "error",
        error: errorMessage,
      };

      this.messages.push(assistantMessage);
      await this.sendMessageToWebview("addMessage", assistantMessage);
    }
  }

  private async addFileContext() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      await this.sendMessageToWebview("error", "No active editor");
      return;
    }

    this.currentContext = {
      fileContext: {
        path: editor.document.uri.fsPath,
        language: editor.document.languageId,
        content: editor.document.getText(),
      },
      selectionContext:
        editor.selection && !editor.selection.isEmpty
          ? {
              text: editor.document.getText(editor.selection),
              startLine: editor.selection.start.line + 1,
              endLine: editor.selection.end.line + 1,
            }
          : undefined,
    };

    await this.sendMessageToWebview("updateContext", {
      filename: editor.document.uri.fsPath.split("/").pop(),
      hasSelection: !!this.currentContext.selectionContext,
    });
  }

  private removeContext() {
    this.currentContext = null;
    this.sendMessageToWebview("updateContext", null);
  }

  private buildContext(): string | undefined {
    if (!this.currentContext) {
      return undefined;
    }

    let context = "";
    if (this.currentContext.fileContext) {
      context += `File: ${this.currentContext.fileContext.path}\n`;
      context += `Language: ${this.currentContext.fileContext.language}\n\n`;

      if (this.currentContext.selectionContext) {
        context += `Selected code (lines ${this.currentContext.selectionContext.startLine}-${this.currentContext.selectionContext.endLine}):\n`;
        context += this.currentContext.selectionContext.text;
      } else {
        context += "File content:\n";
        context += this.currentContext.fileContext.content;
      }
    }

    return context;
  }

  private async generateSuggestions(lastResponse: string) {
    try {
      const providerManager = ProviderManager.getInstance();
      const activeProvider = providerManager.getActiveProvider();

      if (!activeProvider) {
        return;
      }

      const response = await activeProvider.complete({
        prompt: `Based on this conversation and my last response: "${lastResponse}", suggest 3 relevant follow-up questions that the user might want to ask. Format them as a JSON array of strings.`,
        maxTokens: 100,
      });

      let suggestions: string[] = [];
      try {
        suggestions = JSON.parse(response.text);
      } catch {
        suggestions = response.text
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .slice(0, 3);
      }

      await this.sendMessageToWebview("updateSuggestions", suggestions);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
    }
  }

  private async initializeChat() {
    const manager = ProviderManager.getInstance();
    const provider = manager.getActiveProvider();
    const model = manager.getActiveModel();

    if (provider && model) {
      await this.sendMessageToWebview("initialize", {
        provider: {
          name: provider.name,
          model: model.name,
        },
        messages: this.messages,
        context: this.currentContext
          ? {
              filename: this.currentContext.fileContext?.path.split("/").pop(),
              hasSelection: !!this.currentContext.selectionContext,
            }
          : null,
      });
    }
  }

  private clearChat() {
    this.messages = [];
    this.sendMessageToWebview("clearChat");
  }

  private copyLastResponse() {
    const lastResponse = [...this.messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.status === "received");

    if (lastResponse) {
      vscode.env.clipboard.writeText(lastResponse.content);
      this.sendMessageToWebview("notification", "Response copied to clipboard");
    }
  }

  private async sendMessageToWebview(type: string, content?: any) {
    if (this._view) {
      await this._view.webview.postMessage({ type, content });
    }
  }
}
