/**
 * Model loader for LFM2-350M-Q6_K.gguf using node-llama-cpp
 * Handles model initialization and provides inference capabilities
 */

const path = require('path');

let model = null;
let isInitialized = false;

/**
 * Initialize the LLM model
 * @param {Object} options - Configuration options
 * @param {string} options.modelPath - Path to the model file (LFM2-350M-Q6_K.gguf)
 * @param {number} options.contextSize - Context window size (default: 2048)
 * @param {number} options.gpuLayers - Number of layers to offload to GPU (default: 0)
 * @returns {Promise<boolean>} Returns true if initialization successful
 */
async function initializeModel(options = {}) {
  if (isInitialized) {
    console.log('Model already initialized');
    return true;
  }

  try {
    // Dynamic import for node-llama-cpp (ESM module)
    const { getLlama } = await import('node-llama-cpp');
    
    const modelPath = options.modelPath || path.join(process.cwd(), 'models', 'LFM2-350M-Q6_K.gguf');
    const contextSize = options.contextSize || 2048;
    const gpuLayers = options.gpuLayers || 0;

    console.log(`Initializing model from: ${modelPath}`);
    console.log(`Context size: ${contextSize}, GPU layers: ${gpuLayers}`);

    // Get llama instance
    const llama = await getLlama();

    // Load the model
    const loadedModel = await llama.loadModel({
      modelPath: modelPath
    });

    // Create context
    const context = await loadedModel.createContext({
      contextSize: contextSize
    });

    // Store model and context
    model = {
      llama,
      model: loadedModel,
      context,
      createSession: async () => {
        return await context.createSession();
      }
    };

    isInitialized = true;
    console.log('Model initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize model:', error);
    throw new Error(`Model initialization failed: ${error.message}`);
  }
}

/**
 * Run inference on the loaded model
 * @param {string} prompt - The prompt to send to the model
 * @param {Object} options - Inference options
 * @param {number} options.temperature - Sampling temperature (default: 0.7)
 * @param {number} options.maxTokens - Maximum tokens to generate (default: 500)
 * @param {number} options.topP - Top-p sampling (default: 0.9)
 * @returns {Promise<string>} Generated text
 */
async function runInference(prompt, options = {}) {
  if (!isInitialized || !model) {
    throw new Error('Model not initialized. Call initializeModel() first.');
  }

  try {
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 500;
    const topP = options.topP || 0.9;

    // Create a session for this inference
    const session = await model.createSession();

    let generatedText = '';

    // Run the prompt
    await session.prompt(prompt, {
      temperature,
      maxTokens,
      topP,
      onToken: (chunk) => {
        // Accumulate tokens as they're generated
        generatedText += chunk;
      }
    });

    return generatedText.trim();
  } catch (error) {
    console.error('Inference failed:', error);
    throw new Error(`Inference failed: ${error.message}`);
  }
}

/**
 * Check if model is initialized
 * @returns {boolean}
 */
function isModelInitialized() {
  return isInitialized;
}

/**
 * Unload the model and free resources
 * @returns {Promise<void>}
 */
async function unloadModel() {
  if (!isInitialized || !model) {
    return;
  }

  try {
    // Dispose of resources
    if (model.context) {
      await model.context.dispose();
    }
    if (model.model) {
      await model.model.dispose();
    }

    model = null;
    isInitialized = false;
    console.log('Model unloaded successfully');
  } catch (error) {
    console.error('Error unloading model:', error);
    throw error;
  }
}

module.exports = {
  initializeModel,
  runInference,
  isModelInitialized,
  unloadModel
};
