```javascript
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const chalk = require('chalk');
const tf = require('@tensorflow/tfjs-node'); // Use tfjs-node for server-side
const configLoader = require('../utils/configLoader'); // Assuming a utility to load configurations
const { exit } = require('process');

// --- Configuration ---
/**
 * Default configuration for the AI training process.
 * This can be overridden by a custom config file or CLI arguments.
 */
const defaultConfig = {
    modelName: 'AppWriterAI', // A unique identifier for the model
    modelType: 'text-generation-lstm', // Can be expanded for other model types (e.g., transformer)
    data: {
        trainFile: 'training_data.txt', // Name of the main training data file (e.g., code snippets)
        validationFile: 'validation_data.txt', // Optional validation data file
        maxSequenceLength: 100, // Maximum length of input sequences for the model
        vocabSize: 0, // Placeholder, will be determined from data
        embeddingDim: 128, // Dimension of the embedding space for tokens
        dataType: 'character', // Type of tokenization: 'character' or 'word'
    },
    training: {
        epochs: 10, // Number of complete passes through the training dataset
        batchSize: 64, // Number of samples per gradient update
        learningRate: 0.001, // Step size for optimizer
        optimizer: 'adam', // Optimization algorithm (e.g., 'adam', 'sgd', 'rmsprop')
        loss: 'sparseCategoricalCrossentropy', // Loss function for multi-class classification (integer targets)
        shuffle: true, // Whether to shuffle the training data before each epoch
        validationSplit: 0.15, // Fraction of the training data to be used as validation data
    },
    paths: {
        baseDir: process.cwd(), // Base directory for the project
        dataDir: path.join(process.cwd(), 'data/ai_training'), // Directory for raw training data
        outputDir: path.join(process.cwd(), 'models/ai_writer'), // Directory to save trained models and related artifacts
        checkpointDir: path.join(process.cwd(), 'models/ai_writer/checkpoints'), // Directory for model checkpoints
        vocabFile: 'vocab.json', // File to store vocabulary mapping
        modelConfig: 'model_config.json', // File to store the training configuration
    },
    logging: {
        level: 'info', // 'info', 'debug', 'warn', 'error'
        logInterval: 10, // Log every N batches during training (if custom callback used)
    }
};

let appConfig = {}; // Stores the merged and resolved configuration

// --- Utility Functions ---

/**
 * Custom logger with colored output for better readability in the console.
 * @param {string} level - The log level ('info', 'warn', 'error', 'success', 'debug').
 * @param {string} message - The message to log.
 */
function log(level, message) {
    if (appConfig.logging && appConfig.logging.level === 'debug' && level === 'debug') {
        const timestamp = new Date().toISOString();
        let coloredMessage;
        switch (level) {
            case 'info':
                coloredMessage = chalk.blue(`[INFO] ${timestamp} ${message}`);
                break;
            case 'warn':
                coloredMessage = chalk.yellow(`[WARN] ${timestamp} ${message}`);
                break;
            case 'error':
                coloredMessage = chalk.red(`[ERROR] ${timestamp} ${message}`);
                break;
            case 'success':
                coloredMessage = chalk.green(`[SUCCESS] ${timestamp} ${message}`);
                break;
            case 'debug':
                coloredMessage = chalk.gray(`[DEBUG] ${timestamp} ${message}`);
                break;
            default:
                coloredMessage = `[${level.toUpperCase()}] ${timestamp} ${message}`;
        }
        console.log(coloredMessage);
    } else if (level !== 'debug') {
        const timestamp = new Date().toISOString();
        let coloredMessage;
        switch (level) {
            case 'info':
                coloredMessage = chalk.blue(`[INFO] ${timestamp} ${message}`);
                break;
            case 'warn':
                coloredMessage = chalk.yellow(`[WARN] ${timestamp} ${message}`);
                break;
            case 'error':
                coloredMessage = chalk.red(`[ERROR] ${timestamp} ${message}`);
                break;
            case 'success':
                coloredMessage = chalk.green(`[SUCCESS] ${timestamp} ${message}`);
                break;
            default:
                coloredMessage = `[${level.toUpperCase()}] ${timestamp} ${message}`;
        }
        console.log(coloredMessage);
    }
}

/**
 * Ensures a directory exists, creating it recursively if necessary.
 * @param {string} dirPath - The path to the directory.
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        log('info', `Creating directory: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// --- Data Preparation ---

/**
 * Loads text data from a specified file path.
 * @param {string} filePath - The path to the text file.
 * @returns {string} The content of the file as a string.
 * @throws {Error} If the file does not exist.
 */
function loadTextData(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Data file not found: ${filePath}`);
    }
    log('info', `Loading data from: ${filePath}`);
    return fs.readFileSync(filePath, 'utf8');
}

/**
 * Creates a character-level vocabulary from a given text, mapping each unique character
 * to an integer index and vice-versa.
 * @param {string} text - The input text to build the vocabulary from.
 * @returns {{charToIdx: Map<string, number>, idxToChar: string[], vocabSize: number}}
 *          An object containing character-to-index map, index-to-character array, and vocabulary size.
 */
function createCharVocabulary(text) {
    const uniqueChars = Array.from(new Set(text)).sort();
    const charToIdx = new Map(uniqueChars.map((char, i) => [char, i]));
    const idxToChar = uniqueChars;
    const vocabSize = uniqueChars.length;

    log('info', `Created character vocabulary with ${vocabSize} unique characters.`);
    return { charToIdx, idxToChar, vocabSize };
}

/**
 * Preprocesses text data into sequences of integer tokens suitable for training.
 * It creates input-target pairs where each input is a sequence of characters and
 * the target is the next character in the sequence.
 * @param {string} text - The raw text data.
 * @param {Map<string, number>} charToIdx - The map from characters to integer indices.
 * @param {number} maxSequenceLength - The desired length of input sequences.
 * @returns {{xs: tf.Tensor, ys: tf.Tensor}} - TensorFlow tensors for input sequences (xs)
 *          and corresponding target characters (ys).
 * @throws {Error} If not enough data to create sequences.
 */
function preprocessTextData(text, charToIdx, maxSequenceLength) {
    log('info', 'Preprocessing text data...');
    const data = text.split('').map(char => charToIdx.get(char));

    const inputs = [];
    const targets = [];

    // Create input-output pairs (sliding window)
    for (let i = 0; i < data.length - maxSequenceLength; i++) {
        const inputSequence = data.slice(i, i + maxSequenceLength);
        const targetChar = data[i + maxSequenceLength];

        // Ensure all values are valid (not undefined, in case of unknown chars)
        if (inputSequence.every(val => val !== undefined) && targetChar !== undefined) {
            inputs.push(inputSequence);
            targets.push(targetChar);
        }
    }

    if (inputs.length === 0) {
        throw new Error("Not enough data to create sequences. Check maxSequenceLength and data length.");
    }

    log('info', `Generated ${inputs.length} training sequences.`);

    // Convert to TensorFlow tensors
    const xs = tf.tensor2d(inputs, [inputs.length, maxSequenceLength], 'int32');
    const ys = tf.tensor1d(targets, 'int32'); // Target is a single integer (index of the next char)

    return { xs, ys };
}

/**
 * Loads or creates a vocabulary, then preprocesses the training data into tensors.
 * This function handles saving/loading the vocabulary to/from a JSON file.
 * @param {object} config - The training configuration object.
 * @returns {Promise<{xs: tf.Tensor, ys: tf.Tensor, vocab: object}>}
 *          An object containing input tensor (xs), target tensor (ys), and the vocabulary.
 */
async function prepareTrainingData(config) {
    const { dataDir, trainFile, vocabFile } = config.paths;
    const { maxSequenceLength, dataType } = config.data; // dataType is currently only 'character'

    const dataFilePath = path.join(dataDir, trainFile);
    const vocabFilePath = path.join(dataDir, vocabFile);

    let charToIdx;
    let idxToChar;
    let vocabSize;

    // Ensure data directory exists
    ensureDirectoryExists(dataDir);

    // Try to load existing vocabulary
    if (fs.existsSync(vocabFilePath)) {
        log('info', `Loading existing vocabulary from: ${vocabFilePath}`);
        const vocabData = JSON.parse(fs.readFileSync(vocabFilePath, 'utf8'));
        charToIdx = new Map(Object.entries(vocabData.charToIdx));
        idxToChar = vocabData.idxToChar;
        vocabSize = vocabData.vocabSize;
    } else {
        log('info', 'Creating new vocabulary...');
        const rawText = loadTextData(dataFilePath);
        const vocab = createCharVocabulary(rawText);
        charToIdx = vocab.charToIdx;
        idxToChar = vocab.idxToChar;
        vocabSize = vocab.vocabSize;

        // Save vocabulary
        fs.writeFileSync(vocabFilePath, JSON.stringify({
            charToIdx: Object.fromEntries(charToIdx), // Convert Map to object for JSON
            idxToChar: idxToChar,
            vocabSize: vocabSize
        }, null, 2), 'utf8');
        log('success', `Vocabulary saved to: ${vocabFilePath}`);
    }

    // Load raw text data and preprocess it
    const rawText = loadTextData(dataFilePath);
    const { xs, ys } = preprocessTextData(rawText, charToIdx, maxSequenceLength);

    return { xs, ys, vocab: { charToIdx, idxToChar, vocabSize } };
}

// --- Model Definition ---

/**
 * Creates an LSTM-based text generation model using TensorFlow.js.
 * This model takes sequences of token IDs, embeds them, processes them with LSTMs,
 * and outputs probabilities for the next token.
 * @param {object} config - The training configuration object.
 * @returns {tf.LayersModel} The compiled TensorFlow.js model.
 * @throws {Error} If vocabulary size is not positive.
 */
function createLSTMModel(config) {
    const { vocabSize, embeddingDim, maxSequenceLength } = config.data;
    const { learningRate, optimizer, loss } = config.training;

    log('info', `Creating LSTM model with vocabSize=${vocabSize}, embeddingDim=${embeddingDim}, maxSequenceLength=${maxSequenceLength}`);

    if (vocabSize <= 0) {
        throw new Error('Vocabulary size must be greater than 0 to create a model. Ensure data is prepared.');
    }

    const model = tf.sequential();

    // Embedding layer: Converts integer token IDs into dense vectors
    model.add(tf.layers.embedding({
        inputDim: vocabSize,
        outputDim: embeddingDim,
        inputLength: maxSequenceLength, // Specifies the fixed length of input sequences
        name: 'embedding_layer'
    }));

    // LSTM layers: Process the sequence data.
    // returnSequences: true for the first LSTM to pass full sequence to the next LSTM.
    model.add(tf.layers.lstm({
        units: 256, // Number of LSTM units (memory cells)
        returnSequences: true,
        name: 'lstm_layer_1'
    }));
    model.add(tf.layers.dropout({ rate: 0.2 })); // Dropout for regularization

    // Second LSTM layer. returnSequences: false as we only need the output from the last timestep.
    model.add(tf.layers.lstm({
        units: 256,
        returnSequences: false,
        name: 'lstm_layer_2'
    }));
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Dense output layer: Maps LSTM output to a probability distribution over the vocabulary.
    // Softmax activation ensures outputs are probabilities that sum to 1.
    model.add(tf.layers.dense({
        units: vocabSize,
        activation: 'softmax',
        name: 'output_dense'
    }));

    // Initialize the optimizer
    const opt = tf.train[optimizer](learningRate);

    // Compile the model: Configure the learning process
    model.compile({
        optimizer: opt,
        loss: loss,
        metrics: ['accuracy']
    });

    model.summary(); // Print a summary of the model architecture to console
    log('success', 'Model compiled successfully.');

    return model;
}

/**
 * Loads an existing model from a checkpoint path or creates a new one if no path is provided
 * or loading fails. When resuming, the model is recompiled with the specified training configuration.
 * @param {object} config - The training configuration.
 * @param {string} [resumePath] - Optional path to a directory containing a TF.js model to resume from.
 * @returns {Promise<tf.LayersModel>} The loaded or newly created TensorFlow.js model.
 */
async function loadOrCreateModel(config, resumePath = null) {
    let model;
    if (resumePath) {
        // TF.js loadLayersModel expects a URL-like path
        const modelPath = path.join('file://', resumePath, 'model.json');
        log('info', `Attempting to load model from checkpoint: ${modelPath}`);
        try {
            model = await tf.loadLayersModel(modelPath);
            // Recompile the model to ensure optimizer state is correct and to apply current learning rate
            const { learningRate, optimizer, loss } = config.training;
            const opt = tf.train[optimizer](learningRate);
            model.compile({
                optimizer: opt,
                loss: loss,
                metrics: ['accuracy']
            });
            log('success', `Model loaded from ${resumePath} and recompiled.`);
        } catch (e) {
            log('error', `Failed to load model from ${resumePath}: ${e.message}. Creating new model instead.`);
            model = createLSTMModel(config);
        }
    } else {
        log('info', 'Creating a new model...');
        model = createLSTMModel(config);
    }
    return model;
}

// --- Training Loop ---

/**
 * Initiates and manages the AI model training process.
 * This function sets up callbacks for checkpointing, early stopping, and TensorBoard logging,
 * then starts the training loop using `model.fit()`.
 * @param {object} config - The resolved training configuration.
 * @param {tf.LayersModel} model - The TensorFlow.js model to train.
 * @param {tf.Tensor} xs - Input training data tensor.
 * @param {tf.Tensor} ys - Target training data tensor.
 */
async function trainModel(config, model, xs, ys) {
    const { epochs, batchSize, validationSplit, shuffle } = config.training;
    const { checkpointDir, outputDir } = config.paths;
    const { modelName } = config;

    log('info', `Starting training for ${modelName} model...`);
    log('info', `Epochs: ${epochs}, Batch Size: ${batchSize}, Validation Split: ${validationSplit}`);

    // Ensure output directories exist
    ensureDirectoryExists(checkpointDir);
    ensureDirectoryExists(outputDir);

    // Define callbacks for training
    const callbacks = [
        // Early stopping: Stops training if validation loss doesn't improve for a certain number of epochs
        tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 5 }),

        // Model checkpointing: Saves the model (or just weights) periodically
        tf.callbacks.modelCheckpoint({
            filepath: path.join(checkpointDir, 'model-ckpt-{epoch}'), // Pattern for checkpoint paths
            saveWeightsOnly: false, // Save full model (architecture + weights)
            monitor: 'val_loss', // Metric to monitor for saving the "best" model
            saveBest: true, // Only save the model if 'val_loss' has improved
            verbose: 1 // Log when a checkpoint is saved
        }),

        // TensorBoard integration: Logs metrics and graph for visualization in TensorBoard
        tf.callbacks.tensorBoard({
            logdir: path.join(config.paths.baseDir, 'logs', modelName), // Directory for TensorBoard logs
            updateFreq: 'epoch' // Log metrics after each epoch
        })
    ];

    try {
        // Start the training process
        const history = await model.fit(xs, ys, {
            epochs: epochs,
            batchSize: batchSize,
            validationSplit: validationSplit,
            shuffle: shuffle,
            callbacks: callbacks,
            // You can also add custom callbacks for more granular logging:
            // callbacks: [
            //     {
            //         onEpochEnd: (epoch, logs) => {
            //             log('info', `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}, val_acc = ${logs.val_acc.toFixed(4)}`);
            //         },
            //         onBatchEnd: (batch, logs) => {
            //             if (batch % config.logging.logInterval === 0) {
            //                 log('debug', `Batch ${batch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
            //             }
            //         }
            //     }
            // ]
        });

        log('success', 'Training completed!');
        log('info', `Final training loss: ${history.history.loss[history.history.loss.length - 1].toFixed(4)}`);
        log('info', `Final validation loss: ${history.history.val_loss[history.history.val_loss.length - 1].toFixed(4)}`);

        // Save the final trained model
        const savePath = path.join(outputDir, 'final_model');
        await model.save(`file://${savePath}`); // TF.js saves model to a directory
        log('success', `Final model saved to: ${savePath}`);

        // Save model configuration (useful for loading and understanding the trained model later)
        fs.writeFileSync(path.join(outputDir, config.paths.modelConfig), JSON.stringify(appConfig, null, 2), 'utf8');
        log('success', `Model configuration saved to: ${path.join(outputDir, config.paths.modelConfig)}`);

    } catch (error) {
        log('error', `An error occurred during training: ${error.message}`);
        console.error(error); // Log full stack trace for detailed debugging
        exit(1);
    }
}

// --- Main Execution ---
async function main() {
    // Parse command line arguments using yargs
    const argv = yargs
        .option('config', {
            alias: 'c',
            description: 'Path to a custom JSON configuration file.',
            type: 'string',
        })
        .option('epochs', {
            alias: 'e',
            description: 'Number of training epochs.',
            type: 'number',
        })
        .option('batchSize', {
            alias: 'b',
            description: 'Training batch size.',
            type: 'number',
        })
        .option('dataDir', {
            alias: 'd',
            description: 'Directory containing training data.',
            type: 'string',
        })
        .option('outputDir', {
            alias: 'o',
            description: 'Directory to save trained models and checkpoints.',
            type: 'string',
        })
        .option('resume', {
            alias: 'r',
            description: 'Path to a previous checkpoint directory to resume training from. (e.g., ./models/ai_writer/checkpoints/model-ckpt-X)',
            type: 'string',
        })
        .option('debug', {
            description: 'Enable debug logging.',
            type: 'boolean',
            default: false,
        })
        .help()
        .alias('help', 'h')
        .argv;

    // Load and merge configurations
    try {
        log('info', 'Loading configuration...');
        const customConfig = argv.config ? configLoader.loadConfig(argv.config) : {};
        appConfig = configLoader.mergeConfigs(defaultConfig, customConfig);

        // Override logging level if debug flag is set
        if (argv.debug) {
            appConfig.logging.level = 'debug';
            log('debug', 'Debug logging enabled.');
        }

        // Override configuration with CLI arguments
        if (argv.epochs) appConfig.training.epochs = argv.epochs;
        if (argv.batchSize) appConfig.training.batchSize = argv.batchSize;
        // Resolve paths from CLI arguments relative to current working directory
        if (argv.dataDir) appConfig.paths.dataDir = path.resolve(argv.dataDir);
        if (argv.outputDir) appConfig.paths.outputDir = path.resolve(argv.outputDir);
        
        // Recalculate checkpointDir if outputDir was changed via CLI
        appConfig.paths.checkpointDir = path.join(appConfig.paths.outputDir, 'checkpoints');

        log('info', `Resolved data directory: ${appConfig.paths.dataDir}`);
        log('info', `Resolved output directory: ${appConfig.paths.outputDir}`);

    } catch (error) {
        log('error', `Failed to load or parse configuration: ${error.message}`);
        exit(1); // Exit with an error code
    }

    try {
        // Step 1: Prepare training data (load, tokenize, create sequences)
        const { xs, ys, vocab } = await prepareTrainingData(appConfig);
        // Ensure appConfig's vocabSize is updated after vocabulary creation/loading
        appConfig.data.vocabSize = vocab.vocabSize;

        // Step 2: Load an existing model or create a new one
        const model = await loadOrCreateModel(appConfig, argv.resume);

        // Step 3: Train the model
        await trainModel(appConfig, model, xs, ys);

        log('success', 'AI training script finished successfully.');

    } catch (error) {
        log('error', `AI training script failed: ${error.message}`);
        console.error(error); // Log the full error for more context
        exit(1); // Exit with an error code
    }
}

// Execute the main function when the script is run directly
if (require.main === module) {
    main();
}
```