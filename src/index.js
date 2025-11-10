require('dotenv').config();

const logger = require('./utils/logger');
const AIProvider = require('./core/AIProvider');
const CodeGenerator = require('./core/CodeGenerator');
const ProjectManager = require('./core/ProjectManager');
const RequestProcessor = require('./core/RequestProcessor');
const cli = require('./cli');

/**
 * The main entry point for the meta-application.
 * Orchestrates the initialization of core components and handles
 * the application's lifecycle, including command-line argument parsing
 * or interactive mode initiation.
 */
async function main() {
    logger.info('Meta-application starting...');

    try {
        // Initialize AI Provider with configurations from environment variables
        const aiProvider = new AIProvider({
            apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
            model: process.env.AI_MODEL || 'gpt-4o', // Default to a powerful AI model
            // Further AI-specific configurations can be added here
        });

        // Initialize core application logic components
        const projectManager = new ProjectManager();
        // CodeGenerator needs access to project management features for advanced operations
        const codeGenerator = new CodeGenerator(aiProvider, projectManager);
        const requestProcessor = new RequestProcessor(aiProvider, codeGenerator, projectManager);

        // Determine the application's operating mode (CLI or interactive)
        if (process.argv.length > 2) {
            // CLI mode: Arguments are provided directly from the command line
            // Example: `node src/index.js create-app --name MyAwesomeApp --description "A new web app"`
            await cli.handleCommand(process.argv.slice(2), requestProcessor);
        } else {
            // Default mode: No specific command provided, start an interactive session or show help
            logger.info('No command provided. Starting interactive mode or showing help.');
            // This can be extended to launch a web UI server, an interactive CLI prompt, etc.
            await cli.startInteractiveMode(requestProcessor);
        }

    } catch (error) {
        logger.error('An unhandled error occurred in main execution:', error);
        // Log stack trace for development environments
        if (process.env.NODE_ENV !== 'production') {
            console.error(error);
        }
        process.exit(1); // Exit with a non-zero code to indicate an error
    }

    logger.info('Meta-application finished successfully.');
    process.exit(0); // Exit successfully
}

// Global error handling for unhandled promise rejections
// These are promises that were rejected but no `.catch()` handler was attached.
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (reason instanceof Error) {
        logger.error(reason.stack);
    }
    // Terminate the process to prevent the application from continuing in an unstable state.
    process.exit(1);
});

// Global error handling for uncaught exceptions
// These are synchronous errors that were not caught by any try-catch block.
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    logger.error(error.stack);
    // Terminate the process immediately, as the application state is likely corrupted.
    process.exit(1);
});

// Invoke the main function to start the application
main();