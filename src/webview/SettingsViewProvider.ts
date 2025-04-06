import * as vscode from "vscode";
import { BaseViewProvider } from "./BaseViewProvider";
import { ProviderManager } from "../providers/ProviderManager";
import { Provider, ProviderConfig } from "../providers/BaseProvider";
import { ProviderManager } from "../providers/ProviderManager";
export class SettingsViewProvider extends BaseViewProvider {
  protected getHtmlContent(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    const styleUri = this.getUri(webview, "media", "styles", "settings.css");
    const scriptUri = this.getUri(webview, "media", "scripts", "settings.js");

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <link href="${styleUri}" rel="stylesheet">
        <title>Settings</title>
    </head>
    <body>
        <div id="settings-container">
            <div class="settings-section">
                <h2>Provider Settings</h2>
                <div class="provider-selector">
                    <label for="provider-select">Select Provider:</label>
                    <select id="provider-select">
                        <option value="">Choose a provider...</option>
                    </select>
                </div>
                <div id="provider-config" class="provider-config">
                    <!-- Provider configuration fields will be dynamically added here -->
                </div>
            </div>

            <div class="settings-section">
                <h2>Model Settings</h2>
                <div class="model-selector">
                    <label for="model-select">Select Model:</label>
                    <select id="model-select" disabled>
                        <option value="">Choose a model...</option>
                    </select>
                </div>
            </div>

            <div class="settings-section">
                <h2>Voice Input Settings</h2>
                <div class="voice-settings">
                    <label>
                        <input type="checkbox" id="voice-enabled">
                        Enable Voice Input
                    </label>
                    <div class="language-selector">
                        <label for="voice-language">Language:</label>
                        <select id="voice-language" disabled>
                            <option value="en-US">English (US)</option>
                            <option value="en-GB">English (UK)</option>
                            <!-- Add more language options as needed -->
                        </select>
                    </div>
                </div>
            </div>

            <div class="button-container">
                <button id="save-settings" class="primary">Save Settings</button>
                <button id="test-connection">Test Connection</button>
            </div>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  protected setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: { type: string; content?: any }) => {
        const providerManager = ProviderManager.getInstance();

        switch (message.type) {
          case "getProviders":
            const providers = providerManager.getProviders();
            await this.sendProviderList(providers);
            break;

          case "getModels":
            if (message.content?.providerId) {
              const models = await providerManager.getModelsForProvider(
                message.content.providerId
              );
              await this.sendModelList(models);
            }
            break;

          case "saveSettings":
            await this.saveSettings(message.content);
            break;

          case "testConnection":
            await this.testConnection(message.content);
            break;

          case "initialize":
            await this.sendInitialState();
            break;
        }
      },
      undefined,
      this._disposables
    );
  }

  private async sendProviderList(providers: Provider[]) {
    if (this._view) {
      await this._view.webview.postMessage({
        type: "providers",
        providers: providers.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          configFields: p.configFields,
        })),
      });
    }
  }

  private async sendModelList(models: any[]) {
    if (this._view) {
      await this._view.webview.postMessage({
        type: "models",
        models,
      });
    }
  }

  private async saveSettings(settings: {
    providerId: string;
    config: ProviderConfig;
    modelId: string;
    voiceSettings: { enabled: boolean; language: string };
  }) {
    try {
      const providerManager = ProviderManager.getInstance();
      await providerManager.setActiveProvider(settings.providerId, {
        ...settings.config,
        model: settings.modelId,
      });

      // Save voice settings
      await vscode.workspace
        .getConfiguration("aiCodeAssistant")
        .update(
          "voiceInput",
          settings.voiceSettings,
          vscode.ConfigurationTarget.Global
        );

      await this.showNotification("Settings saved successfully");
    } catch (error) {
      this.showError(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    }
  }

  private async testConnection(settings: {
    providerId: string;
    config: ProviderConfig;
  }) {
    try {
      const providerManager = ProviderManager.getInstance();
      const provider = providerManager.getProvider(settings.providerId);

      if (!provider) {
        throw new Error(`Provider '${settings.providerId}' not found`);
      }

      await provider.initialize(settings.config);
      const success = await provider.testConnection();

      if (success) {
        await this.showNotification("Connection successful");
      } else {
        throw new Error("Connection test failed");
      }
    } catch (error) {
      this.showError(
        error instanceof Error ? error.message : "Connection test failed"
      );
    }
  }

  private async sendInitialState() {
    const config = vscode.workspace.getConfiguration("aiCodeAssistant");
    const currentSettings = {
      providerId: config.get<string>("provider"),
      providerConfig: config.get<ProviderConfig>(
        `providers.${config.get<string>("provider")}`
      ),
      voiceSettings: config.get("voiceInput"),
    };

    if (this._view) {
      await this._view.webview.postMessage({
        type: "initialState",
        settings: currentSettings,
      });
    }
  }

  private async showNotification(message: string) {
    if (this._view) {
      await this._view.webview.postMessage({
        type: "notification",
        message,
      });
    }
  }

  private async showError(message: string) {
    if (this._view) {
      await this._view.webview.postMessage({
        type: "error",
        message,
      });
    }
  }
}
import { Model } from "../providers/BaseProvider";

export class SettingsViewProvider extends BaseViewProvider {
  private currentProvider: string | null = null;
  private availableModels: Model[] = [];

  protected getHtmlContent(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    const styleUri = this.getUri(webview, "media", "styles", "settings.css");
    const scriptUri = this.getUri(webview, "media", "scripts", "settings.js");

    const providers = ProviderManager.getInstance().getProviders();
    const providerOptions = providers
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
                <h2>AI Provider Configuration</h2>

                <!-- Provider Selection -->
                <div class="setting-section">
                    <h3>1. Select Provider</h3>
                    <div class="setting-group">
                        <label for="provider">AI Provider:</label>
                        <select id="provider" class="dropdown">
                            <option value="">Select a provider...</option>
                            ${providerOptions}
                        </select>
                    </div>
                    <div id="provider-description" class="description"></div>
                </div>

                <!-- API Configuration -->
                <div class="setting-section">
                    <h3>2. Configure API</h3>
                    <div id="provider-config"></div>
                </div>

                <!-- Model Selection -->
                <div class="setting-section">
                    <h3>3. Select Model</h3>
                    <div class="setting-group">
                        <label for="model">Model:</label>
                        <select id="model" class="dropdown" disabled>
                            <option value="">Select a model...</option>
                        </select>
                    </div>
                    <div id="model-info" class="description"></div>
                </div>

                <!-- Actions -->
                <div class="setting-section">
                    <div id="provider-actions">
                        <button id="save-config" class="primary">Save Configuration</button>
                        <button id="test-connection">Test Connection</button>
                    </div>
                </div>
            </div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
  }

  protected setWebviewMessageListener(webview: vscode.Webview): void {
    webview.onDidReceiveMessage(
      async (message: {
        type: string;
        provider?: string;
        config?: any;
        modelId?: string;
      }) => {
        switch (message.type) {
          case "getProviderConfig":
            if (message.provider) {
              await this.sendProviderConfig(message.provider);
              await this.sendProviderModels(message.provider);
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
          case "getModels":
            if (message.provider) {
              await this.sendProviderModels(message.provider);
            }
            break;
          case "modelSelected":
            if (message.modelId) {
              await this.updateModelInfo(message.modelId);
            }
            break;
          case "initialize":
            await this.sendInitialState();
            break;
        }
      },
      undefined,
      this._disposables
    );
  }

  private async sendInitialState() {
    const manager = ProviderManager.getInstance();
    const activeProvider = manager.getActiveProvider();
    const activeModel = manager.getActiveModel();

    if (this._view) {
      await this._view.webview.postMessage({
        type: "initialState",
        activeProvider: activeProvider?.id,
        activeModel: activeModel?.id,
        providers: manager.getProviders().map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
        })),
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

  private async sendProviderModels(providerId: string) {
    try {
      const manager = ProviderManager.getInstance();
      const models = await manager.getModelsForProvider(providerId);
      this.availableModels = models;

      await this._view?.webview.postMessage({
        type: "models",
        models: models,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      await this._view?.webview.postMessage({
        type: "error",
        message: `Failed to get models: ${message}`,
      });
    }
  }

  private async updateModelInfo(modelId: string) {
    const model = this.availableModels.find((m) => m.id === modelId);
    if (model && this._view) {
      await this._view.webview.postMessage({
        type: "modelInfo",
        model,
      });
    }
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
