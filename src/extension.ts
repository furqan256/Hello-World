import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { ChatViewProvider } from "./webview/ChatViewProvider";
import { EditViewProvider } from "./webview/EditViewProvider";
import { AgentViewProvider } from "./webview/AgentViewProvider";
import { SettingsViewProvider } from "./webview/SettingsViewProvider";
import { ProviderManager } from "./providers/ProviderManager";
import { VoiceInputManager } from "./utils/VoiceInputManager";

export async function activate(context: vscode.ExtensionContext) {
  console.log("AI Code Assistant is now active");

  // Initialize Provider Manager
  const providerManager = ProviderManager.getInstance();
  await providerManager.loadSavedProvider();

  // Initialize Voice Input Manager
  const voiceInputManager = VoiceInputManager.getInstance();
  context.subscriptions.push(voiceInputManager);

  // Register WebView Providers
  const chatViewProvider = new ChatViewProvider(context.extensionUri);
  const editViewProvider = new EditViewProvider(context.extensionUri);
  const agentViewProvider = new AgentViewProvider(context.extensionUri);
  const settingsViewProvider = new SettingsViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("aiChatView", chatViewProvider),
    vscode.window.registerWebviewViewProvider("aiEditView", editViewProvider),
    vscode.window.registerWebviewViewProvider("aiAgentView", agentViewProvider),
    vscode.window.registerWebviewViewProvider(
      "aiSettingsView",
      settingsViewProvider
    )
  );

  // Register Commands
  await registerCommands(context);

  // Update package.json contribution points
  const packageJson = vscode.workspace.getConfiguration("contributes");
  if (!packageJson.has("views.ai-code-assistant")) {
    await vscode.workspace.getConfiguration().update(
      "contributes.views.ai-code-assistant",
      [
        {
          id: "aiChatView",
          name: "Chat",
        },
        {
          id: "aiEditView",
          name: "Editor",
        },
        {
          id: "aiAgentView",
          name: "Agent",
        },
        {
          id: "aiSettingsView",
          name: "Settings",
        },
      ],
      vscode.ConfigurationTarget.Global
    );
  }
}

export function deactivate() {
  console.log("AI Code Assistant is now deactive");
  const providerManager = ProviderManager.getInstance();
  const voiceInputManager = VoiceInputManager.getInstance();

  // Dispose managers
  voiceInputManager.dispose();
  return providerManager.dispose();
}
