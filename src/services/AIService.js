```javascript
import OpenAI from 'openai';

// Ensure your .env file (or environment variables) has OPENAI_API_KEY set.
// In a production environment, use a secure method for managing API keys.
if (!process.env.OPENAI_API_KEY) {
  // In a full Node.js app, you'd typically configure dotenv at the app's entry point.
  // For this service file, we'll assume it's loaded or available.
  console.warn("OPENAI_API_KEY environment variable is not set. AI Service may not function correctly.");
}

// Default configuration for the AI model
const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o'; // Use gpt-4o for advanced capabilities, or gpt-3.5-turbo for cost-efficiency
const DEFAULT_TEMPERATURE = 0.7; // A balance between creativity and predictability
const DEFAULT_MAX_TOKENS = 1024; // A reasonable default for many generation tasks

/**
 * AIService class abstracts interactions with the OpenAI API.
 * It provides a clean, singleton interface for other services to generate text,
 * engage in chat, and stream responses.
 */
class AIService {
  /**
   * Private static instance for the Singleton pattern.
   * @type {AIService}
   */
  static #instance;

  /**
   * Initializes the AIService.
   * Ensures only one instance of the service is created (Singleton pattern).
   */
  constructor() {
    if (AIService.#instance) {
      return AIService.#instance;
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    AIService.#instance = this;
    return AIService.#instance;
  }

  /**
   * Generates text based on a given prompt using the specified AI model.
   * This is a convenient wrapper around the chat method for single-turn text generation.
   *
   * @param {string} prompt The input prompt for text generation.
   * @param {object} [options] Optional parameters for the API call.
   * @param {string} [options.model] The AI model to use (e.g., 'gpt-4o').
   * @param {number} [options.temperature] Controls randomness (0-2), higher values mean more random.
   * @param {number} [options.max_tokens] Maximum number of tokens to generate in the completion.
   * @returns {Promise<string>} The generated text.
   * @throws {Error} If the AI API call fails.
   */
  async generateText(prompt, options = {}) {
    const messages = [{ role: 'user', content: prompt }];
    const response = await this.chat(messages, options);
    return response.content;
  }

  /**
   * Conducts a conversational chat with the AI model.
   *
   * @param {Array<object>} messages An array of message objects, each with a 'role' ('user', 'assistant', 'system') and 'content'.
   *   Example: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: 'Hello!' }]
   * @param {object} [options] Optional parameters for the API call.
   * @param {string} [options.model] The AI model to use.
   * @param {number} [options.temperature] Controls randomness (0-2).
   * @param {number} [options.max_tokens] Maximum number of tokens to generate.
   * @returns {Promise<object>} The AI's response message object ({ role: 'assistant', content: '...' }).
   * @throws {Error} If the AI API call fails.
   */
  async chat(messages, options = {}) {
    const {
      model = DEFAULT_MODEL,
      temperature = DEFAULT_TEMPERATURE,
      max_tokens = DEFAULT_MAX_TOKENS,
      ...rest
    } = options;

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
        ...rest, // Allows passing other OpenAI specific options
      });

      return completion.choices[0].message;
    } catch (error) {
      console.error('Error in AI chat service:', error);
      // Re-throw a more generalized error for upstream handling
      throw new Error(`Failed to get AI chat response: ${error.message || error}`);
    }
  }

  /**
   * Streams a conversational chat response from the AI model.
   * Useful for real-time updates in a UI.
   *
   * @param {Array<object>} messages An array of message objects.
   * @param {(chunk: string) => void} onChunk Callback function called with each received content chunk.
   * @param {object} [options] Optional parameters for the API call.
   * @param {string} [options.model] The AI model to use.
   * @param {number} [options.temperature] Controls randomness (0-2).
   * @param {number} [options.max_tokens] Maximum number of tokens to generate.
   * @returns {Promise<void>} Resolves when the stream is complete.
   * @throws {Error} If the AI API call fails to initialize the stream.
   */
  async streamChat(messages, onChunk, options = {}) {
    const {
      model = DEFAULT_MODEL,
      temperature = DEFAULT_TEMPERATURE,
      max_tokens = DEFAULT_MAX_TOKENS,
      ...rest
    } = options;

    try {
      const stream = await this.openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
        stream: true, // Crucial for streaming
        ...rest,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
    } catch (error) {
      console.error('Error in AI stream chat service:', error);
      throw new Error(`Failed to initiate AI stream: ${error.message || error}`);
    }
  }

  /**
   * Generates code based on a prompt, optionally specifying a language.
   * This method uses a system message to guide the AI towards code generation.
   * It attempts to extract the code block from the response.
   *
   * @param {string} prompt The input prompt describing the code to generate.
   * @param {string} [language] Optional hint for the desired programming language (e.g., 'javascript', 'python').
   * @param {object} [options] Optional parameters for the API call (model, temperature, max_tokens).
   * @returns {Promise<string>} The generated code, attempting to extract it from a markdown code block.
   * @throws {Error} If the AI API call fails.
   */
  async generateCode(prompt, language = '', options = {}) {
    let userPrompt = prompt;
    if (language) {
      userPrompt += `\n\nPlease provide the code in ${language}.`;
    }
    userPrompt += ` Ensure the output is only the code block, enclosed in markdown fences, without extensive explanations unless specifically requested.`;

    const messages = [
      {
        role: 'system',
        content: `You are an expert programmer. Generate code based on user requests. When asked for code, output only the code block, enclosed in markdown fences (e.g., \`\`\`javascript\\n// code\\n\`\`\`), unless specifically requested otherwise. Do not include introductory or concluding remarks outside the code block itself.`,
      },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chat(messages, options);
    const content = response.content;

    // Attempt to extract the code block from the response
    const codeBlockMatch = content.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }

    // If no code block is found, return the full content as a fallback
    return content.trim();
  }
}

// Export a singleton instance of the AIService for easy access throughout the application.
const aiServiceInstance = new AIService();
Object.freeze(aiServiceInstance); // Make the instance immutable after creation

export default aiServiceInstance;
```