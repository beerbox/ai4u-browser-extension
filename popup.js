// Add an event listener for when the popup DOM is fully loaded.
document.addEventListener('DOMContentLoaded', function() {
    const executeButton = document.getElementById('execute-button');
    const resultDiv = document.getElementById('result');
    const executorTabButton = document.getElementById('executor-tab-button');
    const settingsTabButton = document.getElementById('settings-tab-button');
    const executorTabContent = document.getElementById('Executor');
    const settingsTabContent = document.getElementById('Settings');
    const promptTextarea = document.getElementById('prompt-textarea');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const saveSuccessMessage = document.getElementById('save-success');
    const modelInput = document.getElementById('model-input');
    const restoreDefaultsButton = document.getElementById('restore-defaults-button');

    const defaultPrompt = `Please provide a concise summary of the following text (remember to provide the summary in the same language as the text):\n\n{{pageText}}`;

    // Function to open a tab
    function openTab(evt, tabName) {
        let i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(tabName).style.display = "block";
        if (evt) evt.currentTarget.className += " active";
    }

    // Add event listeners for tab switching
    executorTabButton.addEventListener('click', (event) => openTab(event, 'Executor'));
    settingsTabButton.addEventListener('click', (event) => openTab(event, 'Settings'));

    // Open the executor tab by default
    executorTabButton.click();


    // Load saved prompt and model from storage
    chrome.storage.local.get(['customPrompt', 'ollamaModel'], function(result) {
        if (result.customPrompt) {
            promptTextarea.value = result.customPrompt;
        } else {
            // Default prompt
            promptTextarea.value = defaultPrompt;
        }

        if (result.ollamaModel) {
            modelInput.value = result.ollamaModel;
        } else {
            // Default model
            modelInput.value = "gemma3:latest";
        }
    });

    // Save prompt and model to storage
    saveSettingsButton.addEventListener('click', function() {
        const customPrompt = promptTextarea.value;
        const ollamaModel = modelInput.value;
        chrome.storage.local.set({ 
            customPrompt: customPrompt,
            ollamaModel: ollamaModel
        }, function() {
            saveSuccessMessage.textContent = 'Settings saved successfully!';
            setTimeout(() => {
                saveSuccessMessage.textContent = '';
            }, 3000);
        });
    });

    // Restore default settings
    restoreDefaultsButton.addEventListener('click', function() {
        promptTextarea.value = defaultPrompt;
        chrome.storage.local.set({ customPrompt: defaultPrompt }, function() {
            saveSuccessMessage.textContent = 'Default prompt restored!';
            setTimeout(() => {
                saveSuccessMessage.textContent = '';
            }, 3000);
        });
    });


    executeButton.focus();

    // Add a click event listener to the execute button.
    executeButton.addEventListener('click', function() {
        // Show a loading message to the user.
        resultDiv.innerHTML = '<div class="loader">Executing prompt...</div>';
        
        // Get the current active tab.
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            const activeTab = tabs[0];
            if (!activeTab.id) return;

            // Execute the content script in the active tab.
            // This script grabs the page's text content.
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content.js']
            }, (injectionResults) => {
                // Check for errors during injection.
                if (chrome.runtime.lastError || !injectionResults || injectionResults.length === 0) {
                    resultDiv.innerText = 'Error: Could not access page content.';
                    console.error(chrome.runtime.lastError);
                    return;
                }
                
                // The result from the content script is in injectionResults[0].result
                const pageText = injectionResults[0].result;
                if (!pageText) {
                    resultDiv.innerText = 'Could not find any text on this page.';
                    return;
                }

                // Now that we have the text, send it to the Ollama server.
                getOllamaSummary(pageText);
            });
        });
    });

    executeButton.click();

    /**
     * Sends the page text to the Ollama API and displays the summary.
     * @param {string} pageText The text content of the web page.
     */
    async function getOllamaSummary(pageText) {
        // --- Configuration ---
        // Ensure your Ollama server is running and accessible at this URL.
        const OLLAMA_API_URL = "http://localhost:11434/api/generate";

        chrome.storage.local.get(['customPrompt', 'ollamaModel'], async function(result) {
            let prompt;
            if (result.customPrompt) {
                prompt = result.customPrompt.replace('{{pageText}}', pageText);
            } else {
                // Default prompt
                prompt = defaultPrompt.replace('{{pageText}}', pageText);
            }

            const ollamaModel = result.ollamaModel || 'gemma3:latest';

            try {
                const response = await fetch(OLLAMA_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: ollamaModel,
                        prompt: prompt,
                        stream: false, // Set to false to get the full response at once.
                        options: {
                            "num_ctx": 10000
                        }
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Ollama API request failed with status ${response.status}`);
                }

                const data = await response.json();
                
                // Display the summary in the result div.
                resultDiv.innerText = data.response.trim();

            } catch (error) {
                console.error("Error calling Ollama API:", error);
                resultDiv.innerText = `Error: Could not connect to Ollama. Make sure it's running and accessible at ${OLLAMA_API_URL}.\n\nDetails: ${error.message}`;
            }
        });
    }
});

