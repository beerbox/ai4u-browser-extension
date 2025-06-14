# ai4u-browser-extension

Ai4u Browser extension that enables communication between your web browser and local Ollama server.

## Prerequisites

1. **Ollama Installation**
   - Download and install Ollama from [ollama.ai](https://ollama.ai)
   - Follow the installation instructions for your operating system
   - Ensure Ollama is running in the background

2. **CORS Configuration**
   - Ollama needs to be configured to accept requests from your browser extension
   - Set the following environment variable before starting Ollama:
   ```bash
   # Windows (PowerShell)
   $env:OLLAMA_ORIGINS="chrome-extension://*"

   # Windows (Command Prompt)
   set OLLAMA_ORIGINS=chrome-extension://*

   # Linux/macOS
   export OLLAMA_ORIGINS="chrome-extension://*"
   ```
   - Restart Ollama after setting the environment variable
   - Note: The `chrome-extension://*` wildcard allows all Chrome/Edge extensions to connect. For better security, you can specify your extension's ID instead.

3. **Gemma 3 Model**
   - After installing Ollama, pull the Gemma 3 model by running:
   ```bash
   ollama pull gemma3:latest
   ```
   - Verify the model is installed by running:
   ```bash
   ollama list
   ```

## Browser Extension Installation

### Chrome/Edge Installation

1. **Download the Extension**
   - Clone this repository or download the latest release
   - Extract the files to a local directory

2. **Load the Extension**
   - Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the directory containing the extension files

3. **Verify Installation**
   - The extension icon should appear in your browser's toolbar
   - Click the icon to ensure it's properly connected to your local Ollama server

## Usage

1. Click the extension icon in your browser toolbar
2. The extension will attempt to connect to your local Ollama server
3. Once connected, you can interact with the Gemma 3 model through the extension interface
4. **Keyboard Shortcut**: Press `Alt+Shift+S` (Windows/Linux) or `Alt+Shift+S` (macOS) to quickly trigger the extension popup

## Troubleshooting

- Ensure Ollama is running in the background
- Verify the Gemma 3 model is properly installed
- Check that the extension has necessary permissions
- If connection issues persist, try restarting both Ollama and your browser

## Support

For issues and feature requests, please create an issue in the repository.

## License

MIT 
Radek Szpila
