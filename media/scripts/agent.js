(function () {
  const vscode = acquireVsCodeApi();
  let currentTasks = [];
  let activeTask = null;

  // Initialize UI elements
  const taskList = document.getElementById("task-list");
  const taskDetails = document.getElementById("task-details");
  const taskSteps = document.getElementById("task-steps");
  const taskLog = document.getElementById("task-log");
  const newTaskButton = document.getElementById("new-task");
  const stopTaskButton = document.getElementById("stop-button");

  // Initialize event listeners
  newTaskButton.addEventListener("click", () => showTaskMenu());
  stopTaskButton.addEventListener("click", () => stopCurrentTask());

  // Handle incoming messages from extension
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "tasks":
        updateTasks(message.tasks);
        break;
      case "updateTask":
        updateTask(message.task);
        break;
      case "taskLog":
        appendToLog(message.message);
        break;
      case "notification":
        showNotification(message.message);
        break;
      case "error":
        showError(message.message);
        break;
    }
  });

  function updateTasks(tasks) {
    currentTasks = tasks;
    renderTaskList();
  }

  function updateTask(task) {
    const index = currentTasks.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      currentTasks[index] = task;
    } else {
      currentTasks.push(task);
    }

    if (activeTask && activeTask.id === task.id) {
      activeTask = task;
      renderTaskDetails();
    }

    renderTaskList();
    updateStopButton();
  }

  function renderTaskList() {
    taskList.innerHTML = "";
    currentTasks
      .sort((a, b) => b.createdAt - a.createdAt)
      .forEach((task) => {
        const element = createTaskElement(task);
        taskList.appendChild(element);
      });
  }

  function createTaskElement(task) {
    const element = document.createElement("div");
    element.className = `task-item ${task.status} ${
      activeTask && activeTask.id === task.id ? "active" : ""
    }`;
    element.onclick = () => selectTask(task);

    const header = document.createElement("div");
    header.className = "task-header";
    header.textContent = task.name;

    const status = document.createElement("span");
    status.className = `task-status status-${task.status}`;
    status.textContent = task.status;

    header.appendChild(status);
    element.appendChild(header);

    return element;
  }

  function renderTaskDetails() {
    if (!activeTask) {
      taskDetails.innerHTML = "";
      taskSteps.innerHTML = "";
      taskLog.innerHTML = "";
      return;
    }

    // Render task header
    taskDetails.innerHTML = `
      <h3>${activeTask.name}</h3>
      <div class="task-metadata">
        <span>Started: ${new Date(
          activeTask.createdAt
        ).toLocaleTimeString()}</span>
        <span class="status-${activeTask.status}">${activeTask.status}</span>
      </div>
    `;

    // Render steps
    taskSteps.innerHTML = "";
    activeTask.steps.forEach((step) => {
      const stepElement = createStepElement(step);
      taskSteps.appendChild(stepElement);
    });
  }

  function createStepElement(step) {
    const element = document.createElement("div");
    element.className = "step-item";

    const header = document.createElement("div");
    header.className = "step-header";

    const description = document.createElement("span");
    description.textContent = step.description;

    const status = document.createElement("span");
    status.className = `step-status status-${step.status}`;
    status.textContent = step.status;

    header.appendChild(description);
    header.appendChild(status);
    element.appendChild(header);

    if (step.result || step.error) {
      const content = document.createElement("div");
      content.className = "step-content";
      content.textContent = step.result || step.error;
      element.appendChild(content);
    }

    return element;
  }

  function selectTask(task) {
    activeTask = task;
    renderTaskDetails();
    updateStopButton();
  }

  function appendToLog(message) {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    taskLog.appendChild(entry);
    taskLog.scrollTop = taskLog.scrollHeight;
  }

  function showTaskMenu() {
    vscode.postMessage({
      type: "showTaskMenu",
    });
  }

  function stopCurrentTask() {
    if (activeTask && activeTask.status === "running") {
      vscode.postMessage({
        type: "stopTask",
        taskId: activeTask.id,
      });
    }
  }

  function updateStopButton() {
    stopTaskButton.disabled = !(activeTask && activeTask.status === "running");
  }

  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  function showError(message) {
    const error = document.createElement("div");
    error.className = "error-message";
    error.textContent = message;
    taskLog.appendChild(error);
    taskLog.scrollTop = taskLog.scrollHeight;
  }

  // Request initial tasks
  vscode.postMessage({ type: "getTasks" });
})();
