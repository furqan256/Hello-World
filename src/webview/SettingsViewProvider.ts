import * as vscode from 'vscode';
import { BaseViewProvider } from './BaseViewProvider';

export interface AIProvider {
    id: string;
    name: string;
    description: string;
    configFields: {
        name: string;
        key: string;
        type: 'string' | 'boolean' | 'number';
        required: boolean;
        secret?: boolean;
    }[];
}

const SUPPORTED_PROVIDERS: AIProvider[] = [
    {
        id: 'openai',
        name: 'OpenAI',
        description: 'Access GPT models through OpenAI\'s API',
        configFields: [
            {
                name: 'API Key',
                key: 'apiKey',
                type: 'string',
                required: true,
                secret: true
            },
            {
                name: 'Model',
                key: 'model',
                type: 'string',
                required: true
            }
        ]
    },
    {
        id: 'huggingface',
        name: 'Hugging Face',
        description: 'Access open-source models through Hugging Face',
        configFields: [
            {
                name: 'API Token',
                key: 'apiToken',
                type: 'string',
                required: true,
                secret: true
            },
            {
                name: 'Model ID',
                key: 'modelId',
                type: 'string',
                required: true
            }
        ]
    }
];

export class SettingsViewProvider extends BaseViewProvider {
    protected getHtmlContent(webview: vscode.Webview): string {
        const nonce = this.getNonce();
        const styleUri = this.getUri(webview, 'media', 'styles', 'settings.css');
        const scriptUri = this.getUri(webview, 'media', 'scripts', 'settings.js');

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
                        ${SUPPORTED_PROVIDERS.map(p => 
                            `<option value="${p.id}">${p.name}</option>`
                        ).join('')}
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

    protected setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            async (message: { type: string; provider?: string; config?: any }) => {
                switch (message.type) {
                    case 'getProviderConfig':
                        if (message.provider) {
                            await this.sendProviderConfig(message.provider);
                        }
                        break;
                    case 'saveConfig':
                        if (message.provider && message.config) {
                            await this.saveProviderConfig(message.provider, message.config);
                        }
                        break;
                    case 'testConnection':
                        if (message.provider) {
                            await this.testProviderConnection(message.provider);
                        }
                        break;
                }
            },
            undefined,
            this._disposables
        );
    }

    private async sendProviderConfig(providerId: string) {
        const config = vscode.workspace.getConfiguration('aiCodeAssistant');
        const providerConfig = config.get(`providers.${providerId}`);
        await this._view?.webview.postMessage({
            type: 'providerConfig',
            provider: providerId,
            config: providerConfig
        });
    }

    private async saveProviderConfig(providerId: string, config: any) {
        try {
            const workspaceConfig = vscode.workspace.getConfiguration('aiCodeAssistant');
            await workspaceConfig.update(`providers.${providerId}`, config, true);
            vscode.window.showInformationMessage(`${providerId} configuration saved successfully.`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save ${providerId} configuration.`);
        }
    }

    private async testProviderConnection(providerId: string) {
        try {
            // TODO: Implement actual provider connection testing
            vscode.window.showInformationMessage(`Testing connection to ${providerId}...`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to connect to ${providerId}.`);
        }
    }

    private readonly _disposables: vscode.Disposable[] = [];
}