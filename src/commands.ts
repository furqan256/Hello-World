import * as vscode from "vscode";
import { ProviderManager } from "./providers/ProviderManager";
import { VoiceInputManager } from "./utils/VoiceInputManager";

export async function registerCommands(context: vscode.ExtensionContext) {
  // Chat commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ai-code-assistant.startChat",
      async (initialMessage?: string) => {
        const view = await vscode.commands.executeCommand("aiChatView.focus");
        if (initialMessage) {
          // TODO: Send initial message to chat view
        }
      }
    )
  );

  // Edit commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ai-code-assistant.suggestCompletion",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          await vscode.commands.executeCommand("aiEditView.focus");
          // Request completion suggestion
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ai-code-assistant.explainCode",
      async (selection?: string) => {
        if (!selection && vscode.window.activeTextEditor) {
          selection = vscode.window.activeTextEditor.document.getText(
            vscode.window.activeTextEditor.selection
          );
        }

        if (selection) {
          await vscode.commands.executeCommand("aiEditView.focus");
          // Send explain request to edit view
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ai-code-assistant.optimizeCode",
      async (selection?: string) => {
        if (!selection && vscode.window.activeTextEditor) {
          selection = vscode.window.activeTextEditor.document.getText(
            vscode.window.activeTextEditor.selection
          );
        }

        if (selection) {
          await vscode.commands.executeCommand("aiEditView.focus");
          // Send optimize request to edit view
        }
      }
    )
  );

  // Agent commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ai-code-assistant.startRefactor",
      async () => {
        await vscode.commands.executeCommand("aiAgentView.focus");
        // Start refactor task
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ai-code-assistant.startDocumentation",
      async () => {
        await vscode.commands.executeCommand("aiAgentView.focus");
        // Start documentation task
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ai-code-assistant.stopCurrentTask",
      async () => {
        // Stop current agent task
      }
    )
  );

  // Settings commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ai-code-assistant.configureProvider",
      async () => {
        await vscode.commands.executeCommand("aiSettingsView.focus");
      }
    )
  );

  // Voice input commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ai-code-assistant.toggleVoiceInput",
      () => {
        VoiceInputManager.getInstance().toggleVoiceInput();
      }
    )
  );

  // Register context menu commands
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "ai-code-assistant.contextExplain",
      (editor: vscode.TextEditor) => {
        const selection = editor.document.getText(editor.selection);
        vscode.commands.executeCommand(
          "ai-code-assistant.explainCode",
          selection
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "ai-code-assistant.contextOptimize",
      (editor: vscode.TextEditor) => {
        const selection = editor.document.getText(editor.selection);
        vscode.commands.executeCommand(
          "ai-code-assistant.optimizeCode",
          selection
        );
      }
    )
  );

  // Register keyboard shortcuts
  await vscode.commands.executeCommand(
    "setContext",
    "aiCodeAssistantEnabled",
    true
  );
}
