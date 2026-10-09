# Ollama Integration for VetPharma ERP

This document explains how to set up and use the Ollama local AI model integration in your VetPharma ERP system.

## Prerequisites

1. **Install Ollama**: Download and install Ollama from [ollama.ai](https://ollama.ai)
2. **Pull Models**: After installing Ollama, pull the models you want to use:
   ```bash
   # Popular models for business use
   ollama pull llama2          # General purpose chat model
   ollama pull llama2:13b      # Larger, more capable model
   ollama pull codellama       # Code-focused model
   ollama pull mistral         # Fast, capable model
   ```

## Features

The AI Assistant provides:

- **Chat Interface**: Conversational AI for asking questions about your pharmaceutical operations
- **Text Generation**: Generate reports, documentation, or analysis
- **Model Selection**: Choose from available Ollama models
- **Real-time Responses**: Streaming responses for better user experience

## Usage

### Accessing the AI Assistant

1. Navigate to **AI Assistant > AI Chat** in the sidebar
2. The system will automatically check if Ollama is running
3. Select your preferred model from the dropdown
4. Choose between "Chat" or "Generate" mode

### Chat Mode
- Conversational interface
- Maintains context across messages
- Ideal for asking questions about operations, quality management, or getting advice

### Generate Mode
- Single-prompt text generation
- Good for creating reports, documentation, or analysis
- No conversation history maintained

## API Commands

The backend exposes these Tauri commands for Ollama integration:

### Check Ollama Status
```javascript
const status = await invoke("check_ollama_status");
// Returns: { success: boolean, running: boolean, version?: string, message: string }
```

### List Available Models
```javascript
const models = await invoke("list_ollama_models");
// Returns: { success: boolean, models: Array, message: string }
```

### Generate Text
```javascript
const response = await invoke("generate_with_ollama", {
    model: "llama2",
    prompt: "Your prompt here",
    stream: false,
    options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1024
    }
});
// Returns: { success: boolean, response: string, done: boolean, message: string }
```

### Chat with AI
```javascript
const response = await invoke("chat_with_ollama", {
    model: "llama2",
    messages: [
        { role: "user", content: "Hello, how can you help with pharmaceutical operations?" }
    ],
    stream: false,
    options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1024
    }
});
// Returns: { success: boolean, message: Object, done: boolean, message_response: string }
```

## Configuration

### Model Parameters

- **Temperature**: Controls randomness (0.0-1.0)
  - Lower values (0.1-0.3): More focused, deterministic responses
  - Higher values (0.7-1.0): More creative, varied responses

- **Top P**: Nucleus sampling parameter (0.0-1.0)
  - Lower values: More focused responses
  - Higher values: More diverse responses

- **Max Tokens**: Maximum response length
  - Default: 1024 tokens
  - Increase for longer responses

### Recommended Models for Pharmaceutical Use

1. **llama2** - General purpose, good for most business queries
2. **mistral** - Fast and capable, good for quick responses
3. **codellama** - Specialized for technical and code-related questions
4. **llama2:13b** - Larger model for more complex analysis

## Troubleshooting

### Ollama Not Connected
- Ensure Ollama is installed and running
- Check that it's accessible on `http://localhost:11434`
- Restart Ollama if needed: `ollama serve`

### No Models Available
- Pull models using: `ollama pull <model_name>`
- Check available models: `ollama list`
- Ensure models are compatible with your system

### Poor Response Quality
- Try different models
- Adjust temperature and top_p parameters
- Use more specific prompts
- Provide context about your pharmaceutical operations

## Security Considerations

- Ollama runs locally, so conversations stay on your machine
- No data is sent to external AI services
- Models and responses are stored locally only
- Consider the sensitivity of information shared with AI

## Future Enhancements

Potential improvements:
- Integration with ERP data for context-aware responses
- Custom fine-tuned models for pharmaceutical domain
- Batch processing capabilities
- Integration with document management
- Automated report generation
- Quality management assistance
- Regulatory compliance guidance