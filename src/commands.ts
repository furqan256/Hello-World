import * as vscode from "vscode";
import { ChatViewProvider } from "./webview/ChatViewProvider";
import { SettingsViewProvider } from "./webview/SettingsViewProvider";

export async function registerCommands(
  context: vscode.ExtensionContext
): Promise<void> {
  // Start Chat Command
  context.subscriptions.push(
    vscode.commands.registerCommand("ai-code-assistant.startChat", () => {
      vscode.commands.executeCommand(
        "workbench.view.extension.ai-code-assistant"
      );
    })
  );

  // Configure Provider Command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ai-code-assistant.configureProvider",
      async () => {
        try {
          await vscode.commands.executeCommand(
            "workbench.view.extension.ai-code-assistant"
          );
          // Focus settings view
          const settingsView = await vscode.window.showTextDocument(
            await vscode.workspace.openTextDocument({
              content: "",
              language: "markdown",
            })
          );
          await vscode.commands.executeCommand(
            "workbench.action.closeActiveEditor"
          );
        } catch (error) {
          vscode.window.showErrorMessage(
            "Failed to open AI provider configuration."
          );
        }
      }
    )
  );

  // Toggle Voice Input Command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ai-code-assistant.toggleVoiceInput",
      () => {
        vscode.window.showInformationMessage(
          "Voice input feature coming soon!"
        );
      }
    )
  );

  // Register inline code suggestion command
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "ai-code-assistant.suggestCode",
      async (editor: vscode.TextEditor) => {
        const document = editor.document;
        const selection = editor.selection;
        const text = document.getText(selection);

        // Get cursor position and surrounding code context
        const position = selection.active;
        const lineText = document.lineAt(position.line).text;
        const precedingText = document.getText(
          new vscode.Range(
            new vscode.Position(Math.max(0, position.line - 10), 0),
            position
          )
        );

        // TODO: Generate code suggestion based on context
        vscode.window.showInformationMessage("Code suggestions coming soon!");
      }
    )
  );

  // Register code explanation command
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "ai-code-assistant.explainCode",
      async (editor: vscode.TextEditor) => {
        const document = editor.document;
        const selection = editor.selection;
        const text = document.getText(selection);

        if (!text) {
          vscode.window.showWarningMessage(
            "Please select some code to explain."
          );
          return;
        }

        // TODO: Generate code explanation
        vscode.window.showInformationMessage("Code explanation coming soon!");
      }
    )
  );
}
