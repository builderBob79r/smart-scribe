/**
 * Prompt templates for different writing styles
 * Each template provides clear instructions to the AI model
 */

const promptTemplates = {
  refine: (text) => `
You are an AI writing assistant. Refine and improve the following text while maintaining its original meaning and tone. Make it more polished and professional.

Text to refine:
${text}

Refined version:`,

  formal: (text) => `
You are an AI writing assistant. Rewrite the following text in a formal, professional style suitable for business or academic contexts.

Text to formalize:
${text}

Formal version:`,

  casual: (text) => `
You are an AI writing assistant. Rewrite the following text in a casual, conversational style that feels friendly and approachable.

Text to make casual:
${text}

Casual version:`,

  grammar: (text) => `
You are an AI writing assistant. Correct any grammar, spelling, and punctuation errors in the following text. Keep the meaning and style unchanged.

Text to correct:
${text}

Corrected version:`,

  concise: (text) => `
You are an AI writing assistant. Make the following text more concise and to the point while preserving all key information.

Text to make concise:
${text}

Concise version:`,

  simplify: (text) => `
You are an AI writing assistant. Simplify the following text to make it easier to understand. Use simpler words and shorter sentences.

Text to simplify:
${text}

Simplified version:`
};

/**
 * Get a prompt template for a specific style
 * @param {string} style - The writing style (refine, formal, casual, grammar, concise, simplify)
 * @param {string} text - The text to process
 * @returns {string} The formatted prompt
 */
function getPrompt(style, text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  const template = promptTemplates[style];
  if (!template) {
    throw new Error(`Unknown style: ${style}. Valid styles are: ${Object.keys(promptTemplates).join(', ')}`);
  }

  return template(text);
}

/**
 * Get all available styles
 * @returns {string[]} Array of available style names
 */
function getAvailableStyles() {
  return Object.keys(promptTemplates);
}

module.exports = {
  getPrompt,
  getAvailableStyles,
  promptTemplates
};
