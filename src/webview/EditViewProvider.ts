import * as vscode from "vscode";
import { BaseViewProvider } from "./BaseViewProvider";
import { ProviderManager } from "../providers/ProviderManager";

interface CodeSuggestion {
  text: string;
  range: vscode.Range;
  explanation?: string;
}

export class EditViewProvider extends BaseViewProvider {
  private suggestions: Map<string, CodeSuggestion[]> = new Map();
  private decorationType: vscode.TextEditorDecorationType;

  constructor(extensionUri: vscode.Uri) {
    super(extensionUri);

    // Create decoration type for inline suggestions
    this.decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: "0 0 0 1em",
        color: new vscode.ThemeColor("editorGhostText.foreground"),
      },
    });

    // Listen to editor changes
    vscode.window.onDidChangeActiveTextEditor(() => this.updateDecorations());
    vscode.workspace.onDidChangeTextDocument(() => this.updateDecorations());
  }

  protected getHtmlContent(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <title>Code Editor</title>
    </head>
    <body>
        <div id="editor-container">
            <div id="suggestion-details"></div>
        </div>
    </body>
    </html>`;
  }

  protected setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: { type: string; content?: any }) => {
        switch (message.type) {
          case "getSuggestions":
            await this.generateSuggestions();
            break;
          case "explainCode":
            if (message.content) {
              await this.explainCode(message.content);
            }
            break;
          case "optimizeCode":
            if (message.content) {
              await this.optimizeCode(message.content);
            }
            break;
        }
      },
      undefined,
      this._disposables
    );
  }

  private async generateSuggestions() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const position = editor.selection.active;
    const lineText = document.lineAt(position.line).text;

    try {
      const provider = ProviderManager.getInstance().getActiveProvider();
      if (!provider) {
        throw new Error("No AI provider configured");
      }

      const response = await provider.complete({
        prompt: `Complete this line of code:\n${lineText}`,
        context: document.getText(),
        maxTokens: 100,
      });

      const suggestion: CodeSuggestion = {
        text: response.text,
        range: new vscode.Range(
          position,
          position.translate(0, response.text.length)
        ),
      };

      const documentSuggestions =
        this.suggestions.get(document.uri.toString()) || [];
      documentSuggestions.push(suggestion);
      this.suggestions.set(document.uri.toString(), documentSuggestions);

      this.updateDecorations();
    } catch (error) {
      console.error("Error generating suggestions:", error);
    }
  }

  private async explainCode(selection: string) {
    try {
      const provider = ProviderManager.getInstance().getActiveProvider();
      if (!provider) {
        throw new Error("No AI provider configured");
      }

      const response = await provider.chat({
        messages: [
          {
            role: "system",
            content:
              "You are a code explanation assistant. Explain the following code in a clear and concise way.",
          },
          {
            role: "user",
            content: selection,
          },
        ],
      });

      if (this._view) {
        this._view.webview.postMessage({
          type: "explanation",
          content: response.message.content,
        });
      }
    } catch (error) {
      console.error("Error explaining code:", error);
    }
  }

  private async optimizeCode(selection: string) {
    try {
      const provider = ProviderManager.getInstance().getActiveProvider();
      if (!provider) {
        throw new Error("No AI provider configured");
      }

      const response = await provider.chat({
        messages: [
          {
            role: "system",
            content:
              "You are a code optimization assistant. Suggest improvements for the following code while maintaining its functionality.",
          },
          {
            role: "user",
            content: selection,
          },
        ],
      });

      if (this._view) {
        this._view.webview.postMessage({
          type: "optimization",
          content: response.message.content,
        });
      }
    } catch (error) {
      console.error("Error optimizing code:", error);
    }
  }

  private updateDecorations() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const documentSuggestions = this.suggestions.get(
      editor.document.uri.toString()
    );
    if (!documentSuggestions) {
      return;
    }

    const decorations = documentSuggestions.map((suggestion) => ({
      range: suggestion.range,
      renderOptions: {
        after: {
          contentText: suggestion.text,
        },
      },
    }));

    editor.setDecorations(this.decorationType, decorations);
  }

  public dispose() {
    super.dispose();
    this.decorationType.dispose();
  }
}
