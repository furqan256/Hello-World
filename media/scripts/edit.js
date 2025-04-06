(function () {
  // Get VS Code webview API
  const vscode = acquireVsCodeApi();
  let currentSuggestions = [];

  // Initialize UI elements
  const suggestionDetails = document.getElementById("suggestion-details");

  // Handle incoming messages from extension
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "addSuggestion":
        addSuggestion(message.suggestion);
        break;
      case "updateSuggestion":
        updateSuggestion(message.suggestion);
        break;
      case "showExplanation":
        showExplanation(message.explanation);
        break;
      case "showOptimization":
        showOptimization(message.optimization);
        break;
      case "error":
        showError(message.message);
        break;
    }
  });

  function addSuggestion(suggestion) {
    const suggestionElement = createSuggestionElement(suggestion);
    suggestionDetails.appendChild(suggestionElement);
    currentSuggestions.push(suggestion);
  }

  function updateSuggestion(suggestion) {
    const existingSuggestion = document.querySelector(
      `[data-suggestion-id="${suggestion.id}"]`
    );
    if (existingSuggestion) {
      existingSuggestion.replaceWith(createSuggestionElement(suggestion));
    }
  }

  function createSuggestionElement(suggestion) {
    const element = document.createElement("div");
    element.className = "suggestion";
    element.setAttribute("data-suggestion-id", suggestion.id);

    const header = document.createElement("div");
    header.className = "suggestion-header";

    const actions = document.createElement("div");
    actions.className = "suggestion-actions";

    const acceptButton = document.createElement("button");
    acceptButton.className = "suggestion-button";
    acceptButton.textContent = "Accept";
    acceptButton.onclick = () => acceptSuggestion(suggestion);

    const explainButton = document.createElement("button");
    explainButton.className = "suggestion-button";
    explainButton.textContent = "Explain";
    explainButton.onclick = () => explainSuggestion(suggestion);

    actions.appendChild(acceptButton);
    actions.appendChild(explainButton);
    header.appendChild(actions);

    const content = document.createElement("div");
    content.className = "code-block";
    content.textContent = suggestion.text;

    element.appendChild(header);
    element.appendChild(content);

    if (suggestion.explanation) {
      const explanation = document.createElement("div");
      explanation.className = "suggestion-explanation";
      explanation.textContent = suggestion.explanation;
      element.appendChild(explanation);
    }

    return element;
  }

  function showExplanation(explanation) {
    const element = document.createElement("div");
    element.className = "suggestion-explanation";
    element.textContent = explanation.text;

    if (explanation.code) {
      const codeBlock = document.createElement("div");
      codeBlock.className = "code-block";
      codeBlock.textContent = explanation.code;
      element.appendChild(codeBlock);
    }

    suggestionDetails.appendChild(element);
  }

  function showOptimization(optimization) {
    const element = document.createElement("div");
    element.className = "suggestion";

    const header = document.createElement("div");
    header.className = "suggestion-header";
    header.textContent = "Optimization Suggestion";

    const actions = document.createElement("div");
    actions.className = "suggestion-actions";

    const applyButton = document.createElement("button");
    applyButton.className = "suggestion-button";
    applyButton.textContent = "Apply";
    applyButton.onclick = () => applyOptimization(optimization);

    actions.appendChild(applyButton);
    header.appendChild(actions);

    const diff = document.createElement("div");
    diff.className = "optimization-diff";
    diff.textContent = optimization.diff;

    element.appendChild(header);
    element.appendChild(diff);

    if (optimization.explanation) {
      const explanation = document.createElement("div");
      explanation.className = "suggestion-explanation";
      explanation.textContent = optimization.explanation;
      element.appendChild(explanation);
    }

    suggestionDetails.appendChild(element);
  }

  function showError(message) {
    const element = document.createElement("div");
    element.className = "error";
    element.textContent = message;
    suggestionDetails.appendChild(element);
  }

  // Event handlers
  function acceptSuggestion(suggestion) {
    vscode.postMessage({
      type: "acceptSuggestion",
      suggestion,
    });
  }

  function explainSuggestion(suggestion) {
    vscode.postMessage({
      type: "explainSuggestion",
      suggestion,
    });
  }

  function applyOptimization(optimization) {
    vscode.postMessage({
      type: "applyOptimization",
      optimization,
    });
  }
})();
