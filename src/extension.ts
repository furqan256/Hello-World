import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { ChatViewProvider } from "./webview/ChatViewProvider";
import { SettingsViewProvider } from "./webview/SettingsViewProvider";
import { ProviderManager } from "./providers/ProviderManager";

export async function activate(context: vscode.ExtensionContext) {
  console.log("AI Code Assistant is now active");

  // Initialize Provider Manager
  const providerManager = ProviderManager.getInstance();
  await providerManager.loadSavedProvider();

  // Register WebView Providers
  const chatViewProvider = new ChatViewProvider(context.extensionUri);
  const settingsViewProvider = new SettingsViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("aiChatView", chatViewProvider),
    vscode.window.registerWebviewViewProvider(
      "aiSettingsView",
      settingsViewProvider
    )
  );

  // Register Commands
  await registerCommands(context);
}

export function deactivate() {
  console.log("AI Code Assistant is now deactive");
  const providerManager = ProviderManager.getInstance();
  return providerManager.dispose();
}
