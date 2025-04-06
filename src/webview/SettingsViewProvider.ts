import * as vscode from "vscode";
import { BaseViewProvider } from "./BaseViewProvider";
import { ProviderManager } from "../providers/ProviderManager";

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  configFields: {
    name: string;
    key: string;
    type: "string" | "boolean" | "number";
    required: boolean;
    secret?: boolean;
  }[];
}

export class SettingsViewProvider extends BaseViewProvider {
  private providers: AIProvider[];
  private currentProvider: string | null = null;

  constructor(extensionUri: vscode.Uri) {
    super(extensionUri);
    this.providers = ProviderManager.getInstance()
      .getProviders()
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        configFields: p.configFields,
      }));
  }

  protected getHtmlContent(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    const styleUri = this.getUri(webview, "media", "styles", "settings.css");
    const scriptUri = this.getUri(webview, "media", "scripts", "settings.js");

    const providerOptions = this.providers
      .map((p) => `<option value="${p.id}">${p.name}</option>`)
      .join("");

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <link href="${styleUri}" rel="stylesheet">
            <title>AI Settings</title>
        </head>
        <body>
            <div id="settings-container">
                <h2>AI Provider Settings</h2>
                <div id="provider-select">
                    <label for="provider">Select Provider:</label>
                    <select id="provider">
                        ${providerOptions}
                    </select>
                </div>
                <div id="provider-config"></div>
                <div id="provider-actions">
                    <button id="save-config">Save Configuration</button>
                    <button id="test-connection">Test Connection</button>
                </div>
            </div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
  }

  protected setWebviewMessageListener(webview: vscode.Webview): void {
    webview.onDidReceiveMessage(
      async (message: { type: string; provider?: string; config?: any }) => {
        switch (message.type) {
          case "getProviderConfig":
            if (message.provider) {
              await this.sendProviderConfig(message.provider);
            }
            break;
          case "saveConfig":
            if (message.provider && message.config) {
              await this.saveProviderConfig(message.provider, message.config);
            }
            break;
          case "testConnection":
            if (message.provider) {
              await this.testProviderConnection(message.provider);
            }
            break;
          case "initialize":
            await this.sendProviders();
            break;
        }
      },
      undefined,
      this._disposables
    );
  }

  private async sendProviders() {
    if (this._view) {
      await this._view.webview.postMessage({
        type: "providers",
        providers: this.providers,
      });
    }
  }

  private async sendProviderConfig(providerId: string) {
    const config = vscode.workspace.getConfiguration("aiCodeAssistant");
    const providerConfig = config.get(`providers.${providerId}`);
    await this._view?.webview.postMessage({
      type: "providerConfig",
      provider: providerId,
      config: providerConfig,
    });
  }

  private async saveProviderConfig(providerId: string, config: any) {
    try {
      const manager = ProviderManager.getInstance();
      await manager.saveProviderConfig(providerId, config);
      await manager.setActiveProvider(providerId, config);

      await this._view?.webview.postMessage({
        type: "success",
        message: `${providerId} configuration saved successfully.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      await this._view?.webview.postMessage({
        type: "error",
        message: `Failed to save ${providerId} configuration: ${message}`,
      });
    }
  }

  private async testProviderConnection(providerId: string) {
    try {
      const provider = ProviderManager.getInstance().getProvider(providerId);
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`);
      }

      const success = await provider.testConnection();
      const message = success
        ? `Successfully connected to ${providerId}`
        : `Failed to connect to ${providerId}`;

      await this._view?.webview.postMessage({
        type: success ? "success" : "error",
        message,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      await this._view?.webview.postMessage({
        type: "error",
        message: `Connection test failed: ${message}`,
      });
    }
  }
}
