import * as vscode from "vscode";
import { Provider, ProviderConfig, Model } from "./BaseProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { AnthropicProvider } from "./AnthropicProvider";
import { MistralProvider } from "./MistralProvider";

export class ProviderManager {
  private static instance: ProviderManager;
  private providers: Map<string, Provider>;
  private activeProvider: Provider | null = null;
  private activeModel: Model | null = null;

  private constructor() {
    this.providers = new Map();
    this.registerDefaultProviders();
  }

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  private registerDefaultProviders() {
    // Register built-in providers
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new MistralProvider());
  }

  public registerProvider(provider: Provider) {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): Provider | undefined {
    return this.providers.get(id);
  }

  public getProviders(): Provider[] {
    return Array.from(this.providers.values());
  }

  public async getModelsForProvider(providerId: string): Promise<Model[]> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }

    try {
      return await provider.getAvailableModels();
    } catch (error) {
      console.error(
        `Failed to get models for provider '${providerId}':`,
        error
      );
      throw error;
    }
  }

  public async setActiveProvider(
    id: string,
    config: ProviderConfig
  ): Promise<void> {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider '${id}' not found`);
    }

    try {
      // Initialize the new provider
      await provider.initialize(config);

      // Test the connection
      const success = await provider.testConnection();
      if (!success) {
        throw new Error(`Failed to connect to provider '${id}'`);
      }

      // Get available models
      const models = await provider.getAvailableModels();
      if (models.length === 0) {
        throw new Error(`No models available for provider '${id}'`);
      }

      // Set the active model to the configured one or the first available
      const configuredModel = models.find((m) => m.id === config.model);
      this.activeModel = configuredModel || models[0];

      // Dispose of the previous active provider if it exists
      if (this.activeProvider) {
        await this.activeProvider.dispose();
      }

      this.activeProvider = provider;

      // Update configuration
      await vscode.workspace
        .getConfiguration("aiCodeAssistant")
        .update("provider", id, vscode.ConfigurationTarget.Global);

      // Save provider configuration
      await this.saveProviderConfig(id, config);
    } catch (error) {
      console.error(`Error setting active provider '${id}':`, error);
      throw error;
    }
  }

  public getActiveProvider(): Provider | null {
    return this.activeProvider;
  }

  public getActiveModel(): Model | null {
    return this.activeModel;
  }

  public async loadSavedProvider(): Promise<void> {
    const config = vscode.workspace.getConfiguration("aiCodeAssistant");
    const providerId = config.get<string>("provider");
    const providerConfig = config.get<ProviderConfig>(
      `providers.${providerId}`
    );

    if (providerId && providerConfig) {
      try {
        await this.setActiveProvider(providerId, providerConfig);
      } catch (error) {
        console.error("Failed to load saved provider:", error);
        vscode.window.showErrorMessage(
          `Failed to initialize saved provider '${providerId}'. Please check your configuration.`
        );
      }
    }
  }

  public async saveProviderConfig(
    id: string,
    config: ProviderConfig
  ): Promise<void> {
    try {
      await vscode.workspace
        .getConfiguration("aiCodeAssistant")
        .update(`providers.${id}`, config, vscode.ConfigurationTarget.Global);
    } catch (error) {
      console.error(`Error saving provider config for '${id}':`, error);
      throw error;
    }
  }

  public async dispose(): Promise<void> {
    if (this.activeProvider) {
      await this.activeProvider.dispose();
      this.activeProvider = null;
    }

    this.providers.clear();
  }
}
