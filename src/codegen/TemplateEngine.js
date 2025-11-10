```javascript
const fs = require('fs');
const path = require('path');

/**
 * @class TemplateEngine
 * @description Manages code templates and snippets used for generating various application components.
 *              Provides functionality to register, load, and render templates using a simple
 *              `{{key.path}}` interpolation syntax.
 */
class TemplateEngine {
    constructor() {
        /**
         * @private
         * @type {Map<string, string>}
         * @description Stores registered templates by their name.
         */
        this.templates = new Map();
    }

    /**
     * Registers a template directly with the engine.
     * If a template with the same name already exists, it will be overwritten.
     * @param {string} name - The unique name for the template (e.g., 'reactComponent', 'apiRoute').
     * @param {string} content - The string content of the template.
     */
    registerTemplate(name, content) {
        if (this.templates.has(name)) {
            console.warn(`TemplateEngine: Template "${name}" is being overwritten.`);
        }
        this.templates.set(name, content);
    }

    /**
     * Asynchronously loads templates from a specified directory.
     * Each file in the directory will be read and registered as a template.
     * The file name (without its extension) will be used as the template name.
     * Subdirectories are not traversed.
     * @param {string} directoryPath - The absolute or relative path to the directory containing template files.
     * @returns {Promise<void>} A promise that resolves when all templates are loaded, or rejects on error.
     */
    async loadTemplatesFromDirectory(directoryPath) {
        try {
            const files = await fs.promises.readdir(directoryPath);
            const loadedCount = 0;

            for (const file of files) {
                const filePath = path.join(directoryPath, file);
                const stat = await fs.promises.stat(filePath);

                if (stat.isFile()) {
                    // Use file name without extension as the template name
                    const templateName = path.parse(file).name;
                    const content = await fs.promises.readFile(filePath, 'utf8');
                    this.registerTemplate(templateName, content);
                    loadedCount++;
                }
            }
            console.log(`TemplateEngine: Loaded ${loadedCount} templates from "${directoryPath}". Total templates: ${this.templates.size}`);
        } catch (error) {
            console.error(`TemplateEngine: Failed to load templates from directory "${directoryPath}":`, error);
            throw error; // Re-throw to propagate the error
        }
    }

    /**
     * Retrieves a value from a data object using a dot-notation key path.
     * For example, `_getValueFromPath({ user: { name: 'Alice' } }, 'user.name')` would return 'Alice'.
     * Handles cases where intermediate paths might be null or undefined.
     * @private
     * @param {object} data - The data object to query.
     * @param {string} keyPath - The dot-notation string representing the path to the desired value.
     * @returns {*} The value found at the specified path, or `undefined` if not found or path is invalid.
     */
    _getValueFromPath(data, keyPath) {
        if (!data || typeof data !== 'object') {
            return undefined;
        }
        return keyPath.split('.').reduce((accumulator, part) => {
            // If accumulator is already null or undefined, or the part doesn't exist on it,
            // subsequent parts can't be resolved.
            return (accumulator && typeof accumulator === 'object' && accumulator[part] !== undefined)
                ? accumulator[part]
                : undefined;
        }, data);
    }

    /**
     * Renders a registered template using the provided data context.
     * The engine replaces placeholders in the format `{{key.path}}` with values from the `data` object.
     * If a placeholder value is `null` or `undefined`, it will be replaced with an empty string.
     * @param {string} templateName - The name of the template to render.
     * @param {object} data - The data context object whose properties will be used to fill placeholders.
     * @returns {string} The rendered template string.
     * @throws {Error} If the specified template name is not found.
     */
    render(templateName, data) {
        const templateContent = this.templates.get(templateName);

        if (!templateContent) {
            throw new Error(`TemplateEngine: Template "${templateName}" not found.`);
        }

        return this._processTemplateString(templateContent, data);
    }

    /**
     * Renders an ad-hoc template string directly, without needing it to be registered.
     * Useful for small snippets or dynamically constructed template content.
     * @param {string} templateString - The raw template content string.
     * @param {object} data - The data context object to use for rendering.
     * @returns {string} The rendered string.
     */
    renderString(templateString, data) {
        return this._processTemplateString(templateString, data);
    }

    /**
     * Internal helper method to process a given template string with data.
     * @private
     * @param {string} content - The template content string.
     * @param {object} data - The data context.
     * @returns {string} The processed string.
     */
    _processTemplateString(content, data) {
        // Regex to find all `{{ key.path }}` placeholders.
        // It captures the `key.path` part.
        return content.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, keyPath) => {
            const value = this._getValueFromPath(data, keyPath);
            // Replace null/undefined with an empty string, otherwise convert to string.
            return (value === null || value === undefined) ? '' : String(value);
        });
    }

    /**
     * Checks if a template with the given name exists in the engine.
     * @param {string} name - The name of the template.
     * @returns {boolean} `true` if the template exists, `false` otherwise.
     */
    hasTemplate(name) {
        return this.templates.has(name);
    }

    /**
     * Returns a list of all registered template names.
     * @returns {string[]} An array of template names.
     */
    listTemplates() {
        return Array.from(this.templates.keys());
    }

    /**
     * Clears all currently registered templates from the engine.
     */
    clearTemplates() {
        this.templates.clear();
        console.log("TemplateEngine: All registered templates have been cleared.");
    }
}

module.exports = TemplateEngine;
```