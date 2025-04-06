(function () {
  const vscode = acquireVsCodeApi();
  let isProcessing = false;

  // Initialize UI elements
  const messagesContainer = document.getElementById("messages");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const stopButton = document.getElementById("stop-button");
  const clearButton = document.getElementById("clear-button");
  const voiceButton = document.getElementById("voice-button");
  const copyButton = document.getElementById("copy-button");
  const contextButton = document.getElementById("context-button");
  const providerInfo = document.getElementById("provider-info");
  const modelInfo = document.getElementById("model-info");
  const contextInfo = document.getElementById("context-info");
  const suggestionList = document.getElementById("suggestion-list");

  // Initialize event listeners
  messageInput.addEventListener("keydown", handleInputKeydown);
  sendButton.addEventListener("click", sendMessage);
  stopButton.addEventListener("click", stopGeneration);
  clearButton.addEventListener("click", clearChat);
  voiceButton.addEventListener("click", toggleVoiceInput);
  copyButton.addEventListener("click", copyLastResponse);
  contextButton.addEventListener("click", addFileContext);

  // Handle incoming messages from extension
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "initialize":
        initializeChat(message.content);
        break;
      case "addMessage":
        addMessage(message.content);
        break;
      case "updateMessage":
        updateMessage(message.content);
        break;
      case "updateContext":
        updateContextInfo(message.content);
        break;
      case "updateSuggestions":
        updateSuggestions(message.content);
        break;
      case "notification":
        showNotification(message.content);
        break;
      case "error":
        showError(message.content);
        break;
      case "clearChat":
        clearChatUI();
        break;
    }
  });

  function initializeChat({ provider, messages, context }) {
    // Set provider info
    if (provider) {
      providerInfo.textContent = provider.name;
      modelInfo.textContent = provider.model;
    }

    // Load messages
    if (messages) {
      messages.forEach(addMessage);
    }

    // Set context
    if (context) {
      updateContextInfo(context);
    }
  }

  function addMessage(message) {
    const messageElement = createMessageElement(message);
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
  }

  function updateMessage(message) {
    const existingMessage = document.querySelector(
      `[data-message-id="${message.id}"]`
    );
    if (existingMessage) {
      existingMessage.replaceWith(createMessageElement(message));
    }
    scrollToBottom();

    if (message.status === "received") {
      isProcessing = false;
      updateUI();
    }
  }

  function createMessageElement(message) {
    const element = document.createElement("div");
    element.className = `message ${message.role} ${message.status || ""}`;
    element.setAttribute("data-message-id", message.id);

    const header = document.createElement("div");
    header.className = "message-header";

    const role = document.createElement("span");
    role.className = "message-role";
    role.textContent = message.role === "user" ? "You" : "Assistant";

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = new Date(message.timestamp).toLocaleTimeString();

    header.appendChild(role);
    header.appendChild(time);

    const content = document.createElement("div");
    content.className = "message-content";

    if (message.status === "sending") {
      content.innerHTML = `<div class="loading-dots"><span>.</span><span>.</span><span>.</span></div>`;
    } else if (message.status === "error") {
      content.innerHTML = `<div class="error-message">${message.error}</div>`;
    } else {
      content.innerHTML = markdownToHtml(message.content);
    }

    element.appendChild(header);
    element.appendChild(content);

    return element;
  }

  function updateContextInfo(context) {
    if (!context) {
      contextInfo.innerHTML = "";
      contextButton.classList.remove("active");
      return;
    }

    contextInfo.innerHTML = `
      <span class="context-file">${context.filename}</span>
      ${
        context.hasSelection
          ? '<span class="context-selection">Selection</span>'
          : ""
      }
      <button class="context-remove" onclick="removeContext()">✕</button>
    `;
    contextButton.classList.add("active");
  }

  function updateSuggestions(suggestions) {
    suggestionList.innerHTML = suggestions
      .map(
        (suggestion) => `
          <div class="suggestion" onclick="useSuggestion('${encodeURIComponent(
            suggestion
          )}')">
            ${suggestion}
          </div>
        `
      )
      .join("");
  }

  function handleInputKeydown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function sendMessage() {
    if (isProcessing || !messageInput.value.trim()) {
      return;
    }

    isProcessing = true;
    updateUI();

    vscode.postMessage({
      type: "sendMessage",
      content: messageInput.value,
    });

    messageInput.value = "";
  }

  function stopGeneration() {
    isProcessing = false;
    updateUI();
    // Implement stop generation logic
  }

  function clearChat() {
    vscode.postMessage({ type: "clearChat" });
  }

  function clearChatUI() {
    messagesContainer.innerHTML = "";
    suggestionList.innerHTML = "";
  }

  function toggleVoiceInput() {
    vscode.postMessage({ type: "toggleVoiceInput" });
  }

  function copyLastResponse() {
    vscode.postMessage({ type: "copyLastResponse" });
  }

  function addFileContext() {
    vscode.postMessage({ type: "addFileContext" });
  }

  function removeContext() {
    vscode.postMessage({ type: "removeContext" });
  }

  function useSuggestion(suggestion) {
    messageInput.value = decodeURIComponent(suggestion);
    sendMessage();
  }

  function updateUI() {
    sendButton.style.display = isProcessing ? "none" : "inline-flex";
    stopButton.style.display = isProcessing ? "inline-flex" : "none";
    messageInput.disabled = isProcessing;
    voiceButton.disabled = isProcessing;
  }

  function markdownToHtml(markdown) {
    // Simple markdown to HTML conversion
    return markdown
      .replace(
        /```(\w*)\n([\s\S]*?)```/g,
        (_, lang, code) => `
        <pre class="code-block${lang ? ` language-${lang}` : ""}">
          <div class="code-header">
            ${lang ? `<span class="code-language">${lang}</span>` : ""}
            <button class="copy-button" onclick="copyCode(this)">Copy</button>
          </div>
          <code>${escapeHtml(code.trim())}</code>
        </pre>
      `
      )
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
    messagesContainer.appendChild(error);
    scrollToBottom();
  }

  // Initialize
  vscode.postMessage({ type: "initialize" });
})();

// Global functions for event handlers
window.removeContext = function () {
  vscode.postMessage({ type: "removeContext" });
};

window.useSuggestion = function (suggestion) {
  const messageInput = document.getElementById("message-input");
  messageInput.value = decodeURIComponent(suggestion);
  document.getElementById("send-button").click();
};

window.copyCode = function (button) {
  const codeBlock = button.parentElement.nextElementSibling;
  const code = codeBlock.textContent;
  navigator.clipboard.writeText(code).then(() => {
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = "Copy";
    }, 2000);
  });
};
