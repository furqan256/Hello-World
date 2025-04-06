import * as vscode from 'vscode';

export abstract class BaseViewProvider implements vscode.WebviewViewProvider {
    protected _view?: vscode.WebviewView;

    constructor(protected readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        this._view.webview.html = this.getHtmlContent(webviewView.webview);

        this.setWebviewMessageListener(webviewView.webview);
    }

    protected abstract getHtmlContent(webview: vscode.Webview): string;
    
    protected abstract setWebviewMessageListener(webview: vscode.Webview): void;

    protected getUri(webview: vscode.Webview, ...pathList: string[]) {
        return webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, ...pathList));
    }

    protected getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}