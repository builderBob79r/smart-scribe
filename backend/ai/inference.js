/**
 * AI Inference module
 * Handles running prompts with different styles against the loaded model
 */

const { getPrompt } = require('./prompts');
const { runInference, isModelInitialized } = require('./modelLoader');

/**
 * Process text with a specific writing style
 * @param {string} text - The text to process
 * @param {string} style - The style to apply (refine, formal, casual, grammar, concise, simplify)
 * @param {Object} options - Additional inference options
 * @param {number} options.temperature - Sampling temperature (default: 0.7)
 * @param {number} options.maxTokens - Maximum tokens to generate (default: 500)
 * @returns {Promise<string>} The processed text
 */
async function processText(text, style, options = {}) {
  if (!isModelInitialized()) {
    throw new Error('Model not initialized. Please initialize the model first.');
  }

  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  try {
    // Get the appropriate prompt for the style
    const prompt = getPrompt(style, text);

    // Run inference with the prompt
    const result = await runInference(prompt, {
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 500,
      topP: options.topP || 0.9
    });

    return result;
  } catch (error) {
    console.error(`Failed to process text with style "${style}":`, error);
    throw new Error(`Text processing failed: ${error.message}`);
  }
}

/**
 * Batch process multiple texts with the same style
 * @param {string[]} texts - Array of texts to process
 * @param {string} style - The style to apply
 * @param {Object} options - Additional inference options
 * @returns {Promise<string[]>} Array of processed texts
 */
async function batchProcess(texts, style, options = {}) {
  if (!Array.isArray(texts)) {
    throw new Error('Texts must be an array');
  }

  const results = [];
  for (const text of texts) {
    try {
      const result = await processText(text, style, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process text in batch:`, error);
      results.push(null); // Push null for failed items
    }
  }

  return results;
}

/**
 * Get AI suggestions for improving text
 * @param {string} text - The text to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Object containing suggestions for different styles
 */
async function getSuggestions(text, options = {}) {
  if (!isModelInitialized()) {
    throw new Error('Model not initialized. Please initialize the model first.');
  }

  const styles = ['refine', 'grammar', 'concise'];
  const suggestions = {};

  for (const style of styles) {
    try {
      suggestions[style] = await processText(text, style, options);
    } catch (error) {
      console.error(`Failed to get suggestion for style "${style}":`, error);
      suggestions[style] = null;
    }
  }

  return suggestions;
}

/**
 * Custom prompt inference (for advanced use cases)
 * @param {string} customPrompt - Custom prompt to send to the model
 * @param {Object} options - Inference options
 * @returns {Promise<string>} The model's response
 */
async function customInference(customPrompt, options = {}) {
  if (!isModelInitialized()) {
    throw new Error('Model not initialized. Please initialize the model first.');
  }

  if (!customPrompt || typeof customPrompt !== 'string') {
    throw new Error('Custom prompt must be a non-empty string');
  }

  try {
    const result = await runInference(customPrompt, options);
    return result;
  } catch (error) {
    console.error('Custom inference failed:', error);
    throw new Error(`Custom inference failed: ${error.message}`);
  }
}

module.exports = {
  processText,
  batchProcess,
  getSuggestions,
  customInference
};
