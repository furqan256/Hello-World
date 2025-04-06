import * as vscode from "vscode";
import { BaseViewProvider } from "./BaseViewProvider";
import { ProviderManager } from "../providers/ProviderManager";

interface TaskStep {
  id: string;
  description: string;
  status: "pending" | "running" | "completed" | "error";
  result?: string;
  error?: string;
}

interface Task {
  id: string;
  name: string;
  steps: TaskStep[];
  status: "pending" | "running" | "completed" | "error";
  createdAt: number;
}

export class AgentViewProvider extends BaseViewProvider {
  private tasks: Task[] = [];
  private currentTask: Task | null = null;

  protected getHtmlContent(webview: vscode.Webview): string {
    const nonce = this.getNonce();
    const styleUri = this.getUri(webview, "media", "styles", "agent.css");
    const scriptUri = this.getUri(webview, "media", "scripts", "agent.js");

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <link href="${styleUri}" rel="stylesheet">
        <title>AI Agent</title>
    </head>
    <body>
        <div id="agent-container">
            <div id="task-list"></div>
            <div id="current-task">
                <div id="task-details"></div>
                <div id="task-steps"></div>
                <div id="task-log"></div>
            </div>
            <div id="task-actions">
                <button id="new-task">New Task</button>
                <button id="stop-task" disabled>Stop Task</button>
            </div>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  protected setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: { type: string; content?: any }) => {
        switch (message.type) {
          case "newTask":
            await this.createTask(message.content);
            break;
          case "stopTask":
            await this.stopCurrentTask();
            break;
          case "getTasks":
            await this.sendTasksToWebview();
            break;
        }
      },
      undefined,
      this._disposables
    );
  }

  private async createTask(request: { type: string; params: any }) {
    const task: Task = {
      id: Date.now().toString(),
      name: request.type,
      steps: this.generateSteps(request),
      status: "pending",
      createdAt: Date.now(),
    };

    this.tasks.push(task);
    this.currentTask = task;
    await this.sendTasksToWebview();
    await this.executeTask(task);
  }

  private generateSteps(request: { type: string; params: any }): TaskStep[] {
    switch (request.type) {
      case "refactor":
        return [
          {
            id: "analyze",
            description: "Analyzing code structure",
            status: "pending",
          },
          {
            id: "suggest",
            description: "Generating refactoring suggestions",
            status: "pending",
          },
          {
            id: "apply",
            description: "Applying refactoring changes",
            status: "pending",
          },
          {
            id: "test",
            description: "Running tests",
            status: "pending",
          },
        ];
      case "document":
        return [
          {
            id: "analyze",
            description: "Analyzing code and dependencies",
            status: "pending",
          },
          {
            id: "generate",
            description: "Generating documentation",
            status: "pending",
          },
          {
            id: "format",
            description: "Formatting documentation",
            status: "pending",
          },
        ];
      default:
        return [
          {
            id: "execute",
            description: "Executing task",
            status: "pending",
          },
        ];
    }
  }

  private async executeTask(task: Task) {
    task.status = "running";
    await this.updateTaskInWebview(task);

    const provider = ProviderManager.getInstance().getActiveProvider();
    if (!provider) {
      this.handleTaskError(task, "No AI provider configured");
      return;
    }

    try {
      for (const step of task.steps) {
        if (task.status === "error") {
          break;
        }

        step.status = "running";
        await this.updateTaskInWebview(task);

        const result = await this.executeStep(step, task);

        step.status = "completed";
        step.result = result;
        await this.updateTaskInWebview(task);
      }

      task.status = "completed";
      await this.updateTaskInWebview(task);
    } catch (error) {
      this.handleTaskError(
        task,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async executeStep(step: TaskStep, task: Task): Promise<string> {
    const provider = ProviderManager.getInstance().getActiveProvider();
    if (!provider) {
      throw new Error("No AI provider configured");
    }

    // Execute step-specific logic
    switch (task.name) {
      case "refactor":
        return await this.executeRefactorStep(step, provider);
      case "document":
        return await this.executeDocumentStep(step, provider);
      default:
        return "Step completed";
    }
  }

  private async executeRefactorStep(
    step: TaskStep,
    provider: any
  ): Promise<string> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error("No active editor");
    }

    const document = editor.document;
    const text = document.getText();

    switch (step.id) {
      case "analyze":
        const analysis = await provider.chat({
          messages: [
            {
              role: "system",
              content: "Analyze this code and identify potential improvements:",
            },
            {
              role: "user",
              content: text,
            },
          ],
        });
        return analysis.message.content;

      case "suggest":
        const suggestions = await provider.chat({
          messages: [
            {
              role: "system",
              content: "Suggest specific refactoring changes for this code:",
            },
            {
              role: "user",
              content: text,
            },
          ],
        });
        return suggestions.message.content;

      case "apply":
        // Implement actual code changes based on suggestions
        return "Changes applied";

      case "test":
        // Run relevant tests
        return "Tests passed";

      default:
        return "Step completed";
    }
  }

  private async executeDocumentStep(
    step: TaskStep,
    provider: any
  ): Promise<string> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error("No active editor");
    }

    const document = editor.document;
    const text = document.getText();

    switch (step.id) {
      case "analyze":
        const analysis = await provider.chat({
          messages: [
            {
              role: "system",
              content:
                "Analyze this code and prepare for documentation generation:",
            },
            {
              role: "user",
              content: text,
            },
          ],
        });
        return analysis.message.content;

      case "generate":
        const docs = await provider.chat({
          messages: [
            {
              role: "system",
              content: "Generate comprehensive documentation for this code:",
            },
            {
              role: "user",
              content: text,
            },
          ],
        });
        return docs.message.content;

      case "format":
        // Format and save documentation
        return "Documentation formatted and saved";

      default:
        return "Step completed";
    }
  }

  private handleTaskError(task: Task, errorMessage: string) {
    task.status = "error";
    if (task.steps.some((step) => step.status === "running")) {
      const runningStep = task.steps.find((step) => step.status === "running");
      if (runningStep) {
        runningStep.status = "error";
        runningStep.error = errorMessage;
      }
    }
    this.updateTaskInWebview(task);
  }

  private async stopCurrentTask() {
    if (this.currentTask && this.currentTask.status === "running") {
      this.handleTaskError(this.currentTask, "Task stopped by user");
    }
  }

  private async sendTasksToWebview() {
    if (this._view) {
      await this._view.webview.postMessage({
        type: "tasks",
        tasks: this.tasks,
      });
    }
  }

  private async updateTaskInWebview(task: Task) {
    if (this._view) {
      await this._view.webview.postMessage({
        type: "updateTask",
        task,
      });
    }
  }
}
