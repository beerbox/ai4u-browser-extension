// Add an event listener for when the popup DOM is fully loaded.
document.addEventListener('DOMContentLoaded', function() {
    const summarizeButton = document.getElementById('summarize-button');
    const resultDiv = document.getElementById('result');

    summarizeButton.focus();

    // Add a click event listener to the summarize button.
    summarizeButton.addEventListener('click', function() {
        // Show a loading message to the user.
        resultDiv.innerHTML = '<div class="loader">Getting content and summarizing...</div>';
        
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

    summarizeButton.click();

    /**
     * Sends the page text to the Ollama API and displays the summary.
     * @param {string} pageText The text content of the web page.
     */
    async function getOllamaSummary(pageText) {
        // --- Configuration ---
        // Change this to your desired Ollama model.
        const OLLAMA_MODEL = "gemma3:latest"; 
        // Ensure your Ollama server is running and accessible at this URL.
        const OLLAMA_API_URL = "http://localhost:11434/api/generate";

        // Prepare the prompt for the language model.
        const prompt = `Please provide a concise summary of the following text (remember to provide the summary in the same language as the text):\n\n${pageText}`;

        try {
            const response = await fetch(OLLAMA_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    prompt: prompt,
                    stream: false // Set to false to get the full response at once.
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
    }
});
