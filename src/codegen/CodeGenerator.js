```javascript
import path from 'path'; // path module might be useful for more complex path manipulations, but not strictly needed for basic string concatenation here.

class CodeGenerator {
    /**
     * Initializes the CodeGenerator with configuration options.
     * @param {object} options - Configuration options for code generation.
     * @param {string} [options.frontendFramework='react'] - The target frontend framework (e.g., 'react', 'vue').
     * @param {string} [options.backendFramework='express'] - The target backend framework (e.g., 'express', 'node-native').
     * @param {string} [options.database='mongodb'] - The target database (e.g., 'mongodb', 'postgresql').
     * @param {string} [options.language='javascript'] - The target language (e.g., 'javascript', 'typescript').
     */
    constructor(options = {}) {
        this.options = {
            frontendFramework: 'react',
            backendFramework: 'express',
            database: 'mongodb',
            language: 'javascript',
            ...options
        };
        this.generatedFiles = {};
    }

    /**
     * The main entry point for generating code.
     * Transforms a high-level design object into a set of executable code files.
     * @param {object} design - The high-level design object describing the application.
     * @param {string} design.appName - The name of the application.
     * @param {object} [design.frontend] - Frontend specific design details.
     * @param {Array<object>} [design.frontend.pages] - List of page definitions.
     * @param {Array<object>} [design.frontend.components] - List of component definitions.
     * @param {object} [design.backend] - Backend specific design details.
     * @param {Array<object>} [design.backend.models] - List of data model definitions.
     * @param {Array<object>} [design.backend.routes] - List of API route definitions.
     * @returns {object} A map where keys are file paths (relative to the app root) and values are their string content.
     */
    generate(design) {
        this.generatedFiles = {}; // Reset for each generation call

        // Determine the app's base directory name
        const appDir = design.appName ? this._slugify(design.appName) : 'my-generated-app';

        // Generate root-level project files (e.g., package.json, README)
        this._generateRootFiles(appDir, design);

        // Generate frontend application files
        this._generateFrontend(appDir, design);

        // Generate backend application files
        this._generateBackend(appDir, design);

        return this.generatedFiles;
    }

    /**
     * Generates root-level project files like package.json, README, .gitignore.
     * @param {string} appDir - The base directory name for the application.
     * @param {object} design - The high-level design object.
     * @private
     */
    _generateRootFiles(appDir, design) {
        const appName = design.appName || 'My Generated App';

        // Main package.json for the monorepo structure
        this.generatedFiles[`${appDir}/package.json`] = this._templatePackageJson(appName, design);
        this.generatedFiles[`${appDir}/README.md`] = this._templateReadme(appName);
        this.generatedFiles[`${appDir}/.gitignore`] = this._templateGitignore();
    }

    /**
     * Generates frontend specific files (e.g., React components, pages, routing).
     * @param {string} appDir - The base directory name for the application.
     * @param {object} design - The high-level design object.
     * @private
     */
    _generateFrontend(appDir, design) {
        const frontendDir = `${appDir}/frontend`;
        const srcDir = `${frontendDir}/src`;

        // Frontend package.json
        this.generatedFiles[`${frontendDir}/package.json`] = this._templateFrontendPackageJson(design.appName);

        // Public directory
        this.generatedFiles[`${frontendDir}/public/index.html`] = this._templateHtml(design.appName);
        this.generatedFiles[`${frontendDir}/src/index.css`] = this._templateFrontendIndexCss();

        // src/index.js
        this.generatedFiles[`${srcDir}/index.js`] = this._templateFrontendIndexJs();

        // src/App.js
        const pages = design.frontend?.pages || [];
        this.generatedFiles[`${srcDir}/App.js`] = this._templateFrontendAppJs(pages);

        // Generate pages
        pages.forEach(page => {
            this.generatedFiles[`${srcDir}/pages/${page.name}.js`] = this._templateFrontendPage(page);
        });

        // Generate components (basic example)
        const components = design.frontend?.components || [];
        components.forEach(component => {
            this.generatedFiles[`${srcDir}/components/${component.name}.js`] = this._templateFrontendComponent(component);
        });

        // Generate a simple API utility for frontend
        this.generatedFiles[`${srcDir}/api.js`] = this._templateFrontendApiUtil();
    }

    /**
     * Generates backend specific files (e.g., Express routes, data models, controllers).
     * @param {string} appDir - The base directory name for the application.
     * @param {object} design - The high-level design object.
     * @private
     */
    _generateBackend(appDir, design) {
        const backendDir = `${appDir}/backend`;
        const srcDir = `${backendDir}/src`;

        const models = design.backend?.models || [];
        const routes = design.backend?.routes || [];

        // Backend package.json
        this.generatedFiles[`${backendDir}/package.json`] = this._templateBackendPackageJson(design.appName);
        this.generatedFiles[`${backendDir}/.env.example`] = 'PORT=5000\nMONGO_URI=mongodb://localhost:27017/mygeneratedapp';

        // Main backend entry point
        this.generatedFiles[`${srcDir}/index.js`] = this._templateBackendIndexJs();

        // Database connection utility
        this.generatedFiles[`${srcDir}/db.js`] = this._templateBackendDbConnection();

        // Models
        models.forEach(model => {
            this.generatedFiles[`${srcDir}/models/${model.name}.js`] = this._templateBackendModel(model);
        });

        // Controllers
        const uniqueModelsInRoutes = new Set();
        routes.forEach(route => {
            const modelName = this._getModelNameFromRouteHandler(route.handler);
            if (modelName) {
                uniqueModelsInRoutes.add(modelName);
            }
        });

        uniqueModelsInRoutes.forEach(modelName => {
            const modelDef = models.find(m => m.name === modelName);
            if (modelDef) {
                this.generatedFiles[`${srcDir}/controllers/${modelName.toLowerCase()}Controller.js`] = this._templateBackendController(modelDef);
            }
        });

        // Routes
        this.generatedFiles[`${srcDir}/routes/api.js`] = this._templateBackendApiRoutes(routes);
    }

    // --- Utility Methods ---

    /**
     * Converts a string to a URL-friendly slug.
     * @param {string} text - The input string.
     * @returns {string} The slugified string.
     * @private
     */
    _slugify(text) {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    }

    /**
     * Extracts the model name from a handler string (e.g., "listUsers" -> "User").
     * @param {string} handler - The handler string.
     * @returns {string|null} The model name if found, otherwise null.
     * @private
     */
    _getModelNameFromRouteHandler(handler) {
        if (!handler) return null;
        const match = handler.match(/^(?:get|list|create|update|delete)([A-Z][a-zA-Z]+)(?:ById)?$/);
        if (match && match[1]) {
            let modelName = match[1];
            // Very basic plural to singular logic (e.g., 'Users' -> 'User')
            if (modelName.endsWith('s') && modelName.length > 1 && !['Status', 'Photos'].includes(modelName)) { // Avoid singularizing words like 'Status'
                modelName = modelName.slice(0, -1);
            }
            return modelName;
        }
        return null;
    }

    /**
     * Extracts the method name from a handler string for controller export (e.g., "listUsers" -> "getUsers").
     * @param {string} handler - The handler string.
     * @returns {string|null} The method name if found, otherwise null.
     * @private
     */
    _getHandlerMethodFromRouteHandler(handler) {
        if (!handler) return null;

        const modelName = this._getModelNameFromRouteHandler(handler);
        if (!modelName) return null;

        // Map simplified handler names to controller methods
        if (handler.startsWith('list') && handler.includes(modelName)) {
            return `get${modelName}s`; // Plural for listing
        }
        if (handler.startsWith('create') && handler.includes(modelName)) {
            return `create${modelName}`;
        }
        if (handler.startsWith('get') && handler.includes(modelName) && handler.endsWith('ById')) {
            return `get${modelName}ById`;
        }
        if (handler.startsWith('get') && handler.includes(modelName)) { // Fallback for general GET (e.g. /api/users)
            return `get${modelName}s`;
        }
        if (handler.startsWith('update') && handler.includes(modelName)) {
            return `update${modelName}`;
        }
        if (handler.startsWith('delete') && handler.includes(modelName)) {
            return `delete${modelName}`;
        }

        return null;
    }

    // --- Templating Methods (private) ---

    _templatePackageJson(appName) {
        const slugAppName = this._slugify(appName);
        const frontendPath = `${slugAppName}/frontend`;
        const backendPath = `${slugAppName}/backend`;
        return JSON.stringify({
            name: slugAppName,
            version: '0.1.0',
            private: true,
            description: `A generated application named ${appName}`,
            scripts: {
                "start": "npm-run-all --parallel start:frontend start:backend",
                "start:frontend": `npm --workspace ${frontendPath} start`,
                "start:backend": `npm --workspace ${backendPath} dev`, // Use dev script for backend
                "install:all": `npm install`, // npm install in root handles workspaces
                "build:frontend": `npm --workspace ${frontendPath} build`,
                "test": "echo \"Error: no test specified\" && exit 1"
            },
            "devDependencies": {
                "npm-run-all": "^4.1.5"
            },
            "workspaces": [
                `./frontend`,
                `./backend`
            ]
        }, null, 2);
    }

    _templateReadme(appName) {
        const slugAppName = this._slugify(appName);
        return `# ${appName}

This application was automatically generated.

## Project Structure

This is a monorepo containing a React frontend and an Express.js backend.

\`\`\`
${slugAppName}/
├── package.json        # Main workspace package.json
├── README.md
├── .gitignore
├── frontend/           # React frontend
│   ├── public/
│   ├── src/
│   └── package.json
└── backend/            # Express.js backend
    ├── src/
    └── package.json
\`\`\`

## Getting Started

1.  **Clone this repository** (or create the files manually if this is the output of the generator).
2.  **Navigate to the project root:**
    \`\`\`bash
    cd ${slugAppName}
    \`\`\`
3.  **Install dependencies for all workspaces:**
    \`\`\`bash
    npm install
    \`\`\`
4.  **Start the application (frontend and backend concurrently):**
    \`\`\`bash
    npm start
    \`\`\`

The frontend will typically run on \`http://localhost:3000\` and the backend API on \`http://localhost:5000\`.

## Frontend (\`./frontend\`)

-   Built with React.
-   \`npm start\` to run in development mode.
-   Access at \`http://localhost:3000\`.

## Backend (\`./backend\`)

-   Built with Node.js and Express.js.
-   \`npm run dev\` to run in development mode with nodemon.
-   API endpoints available at \`http://localhost:5000/api\`.
-   Uses MongoDB for data storage (see \`backend/.env.example\` for configuration).
`;
    }

    _templateGitignore() {
        return `
# Node
node_modules/
.env
.DS_Store
dist/
build/
*.log

# Frontend specific
frontend/node_modules
frontend/build

# Backend specific
backend/node_modules
`;
    }

    // --- Frontend Templates ---

    _templateFrontendPackageJson(appName) {
        return JSON.stringify({
            name: `${this._slugify(appName)}-frontend`,
            version: '0.1.0',
            private: true,
            dependencies: {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-router-dom": "^6.21.1",
                "react-scripts": "5.0.1"
            },
            scripts: {
                "start": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject"
            },
            "eslintConfig": {
                "extends": [
                    "react-app",
                    "react-app/jest"
                ]
            },
            "browserslist": {
                "production": [
                    ">0.2%",
                    "not dead",
                    "not op_mini all"
                ],
                "development": [
                    "last 1 chrome version",
                    "last 1 firefox version",
                    "last 1 safari version"
                ]
            },
            "proxy": "http://localhost:5000" // Proxy API requests to backend
        }, null, 2);
    }

    _templateHtml(appName) {
        return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="${appName} web application"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>${appName}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
`;
    }

    _templateFrontendIndexCss() {
        return `
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

.App {
  text-align: center;
}

header {
  background-color: #282c34;
  padding: 20px;
  color: white;
}

nav ul {
  list-style: none;
  padding: 0;
  display: flex;
  justify-content: center;
  gap: 20px;
}

nav a {
  color: white;
  text-decoration: none;
  font-size: 1.2em;
}

nav a:hover {
  text-decoration: underline;
}

main {
  padding: 20px;
}
`;
    }

    _templateFrontendIndexJs() {
        return `
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
    }

    _templateFrontendAppJs(pages) {
        const imports = pages.map(page => `import ${page.name} from './pages/${page.name}';`).join('\n');
        const routes = pages.map(page =>
            `          <Route path="${page.path}" element={<${page.name} />} />`
        ).join('\n');
        const navLinks = pages.map(page =>
            `          <li><Link to="${page.path}">${page.name}</Link></li>`
        ).join('\n');

        return `
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
${imports}

function App() {
  return (
    <Router>
      <div className="App">
        <header>
          <nav>
            <ul>
${navLinks}
            </ul>
          </nav>
        </header>

        <main>
          <Routes>
${routes}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
`;
    }

    _templateFrontendPage(page) {
        return `
import React from 'react';

function ${page.name}() {
  return (
    <div>
      <h1>${page.name} Page</h1>
      ${page.content || '<p>This is a default page content.</p>'}
    </div>
  );
}

export default ${page.name};
`;
    }

    _templateFrontendComponent(component) {
        const propsDestructure = component.props && component.props.length > 0
            ? `{ ${component.props.map(p => p.name || p).join(', ')} }`
            : '';
        const componentContent = component.content || `<p>This is a default ${component.name} component.</p>`;

        // For documentation within the generated code
        const exampleUsageProps = component.props && component.props.length > 0
            ? component.props.map(p => {
                const propName = p.name || p;
                const propType = p.type || 'string';
                let defaultValue = '';
                switch(propType.toLowerCase()) {
                    case 'string': defaultValue = `"${propName} value"`; break;
                    case 'number': defaultValue = '{123}'; break;
                    case 'boolean': defaultValue = '{true}'; break;
                    default: defaultValue = `"${propName} value"`;
                }
                return `${propName}=${defaultValue}`;
            }).join(' ')
            : '';

        return `
import React from 'react';

function ${component.name}(${propsDestructure}) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px auto', maxWidth: '800px' }}>
      <h2>${component.name}</h2>
      ${componentContent}
      {/* Example usage: <${component.name} ${exampleUsageProps} /> */}
    </div>
  );
}

export default ${component.name};
`;
    }

    _templateFrontendApiUtil() {
        return `
import axios from 'axios';

const API_BASE_URL = '/api'; // React proxy will handle /api prefix

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Example API calls (adjust based on your backend routes and models)
export const fetchUsers = () => api.get('/users');
export const fetchUserById = (id) => api.get(\`/users/\${id}\`);
export const createUser = (userData) => api.post('/users', userData);
export const updateUser = (id, userData) => api.put(\`/users/\${id}\`, userData);
export const deleteUser = (id) => api.delete(\`/users/\${id}\`);

export default api;
`;
    }

    // --- Backend Templates ---

    _templateBackendPackageJson(appName) {
        return JSON.stringify({
            name: `${this._slugify(appName)}-backend`,
            version: '0.1.0',
            private: true,
            scripts: {
                "start": "node src/index.js",
                "dev": "nodemon src/index.js",
                "test": "echo \"Error: no test specified\" && exit 1"
            },
            dependencies: {
                "express": "^4.18.2",
                "mongoose": "^8.0.3",
                "dotenv": "^16.3.1",
                "cors": "^2.8.5",
                "express-async-handler": "^1.2.0"
            },
            devDependencies: {
                "nodemon": "^3.0.2"
            }
        }, null, 2);
    }

    _templateBackendIndexJs() {
        return `
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json

// API Routes
app.use('/api', apiRoutes);

// Basic root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;
    }

    _templateBackendDbConnection() {
        return `
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
`;
    }

    _templateBackendModel(model) {
        const schemaFields = model.fields.map(field => {
            let fieldDef = `${field.name}: { type: ${field.type}`;
            if (field.unique) fieldDef += `, unique: true`;
            if (field.required) fieldDef += `, required: true`;
            if (field.default !== undefined) fieldDef += `, default: ${JSON.stringify(field.default)}`;
            fieldDef += ` }`;
            return fieldDef;
        }).join(',\n    ');

        return `
import mongoose from 'mongoose';

const ${model.name}Schema = new mongoose.Schema({
    ${schemaFields}
}, {
    timestamps: true
});

const ${model.name} = mongoose.model('${model.name}', ${model.name}Schema);

export default ${model.name};
`;
    }

    _templateBackendController(model) {
        const modelName = model.name;
        const lowerCaseModelName = modelName.toLowerCase();
        const pluralLowerCaseModelName = lowerCaseModelName + 's'; // Simplistic pluralization
        const importModel = `import ${modelName} from '../models/${modelName}.js';`;

        // Determine fields for create/update from model definition
        const fieldsToUse = model.fields.map(f => f.name).filter(f => f !== 'id' && f !== '_id');
        const destructureFields = `{ ${fieldsToUse.join(', ')} }`;
        const assignmentFields = fieldsToUse.map(f => `${lowerCaseModelName}.${f} = ${f} || ${lowerCaseModelName}.${f};`).join('\n    ');
        const newModelFields = fieldsToUse.map(f => `    ${f},`).join('\n');


        return `
import asyncHandler from 'express-async-handler';
${importModel}

// @desc    Get all ${pluralLowerCaseModelName}
// @route   GET /api/${pluralLowerCaseModelName}
// @access  Public
const get${modelName}s = asyncHandler(async (req, res) => {
  const ${pluralLowerCaseModelName} = await ${modelName}.find({});
  res.json(${pluralLowerCaseModelName});
});

// @desc    Get single ${lowerCaseModelName}
// @route   GET /api/${pluralLowerCaseModelName}/:id
// @access  Public
const get${modelName}ById = asyncHandler(async (req, res) => {
  const ${lowerCaseModelName} = await ${modelName}.findById(req.params.id);

  if (${lowerCaseModelName}) {
    res.json(${lowerCaseModelName});
  } else {
    res.status(404);
    throw new Error('${modelName} not found');
  }
});

// @desc    Create a ${lowerCaseModelName}
// @route   POST /api/${pluralLowerCaseModelName}
// @access  Public
const create${modelName} = asyncHandler(async (req, res) => {
  const ${destructureFields} = req.body;

  const ${lowerCaseModelName} = new ${modelName}({
${newModelFields}
  });

  const created${modelName} = await ${lowerCaseModelName}.save();
  res.status(201).json(created${modelName});
});

// @desc    Update a ${lowerCaseModelName}
// @route   PUT /api/${pluralLowerCaseModelName}/:id
// @access  Public
const update${modelName} = asyncHandler(async (req, res) => {
  const ${destructureFields} = req.body;

  const ${lowerCaseModelName} = await ${modelName}.findById(req.params.id);

  if (${lowerCaseModelName}) {
    ${assignmentFields}

    const updated${modelName} = await ${lowerCaseModelName}.save();
    res.json(updated${modelName});
  } else {
    res.status(404);
    throw new Error('${modelName} not found');
  }
});

// @desc    Delete a ${lowerCaseModelName}
// @route   DELETE /api/${pluralLowerCaseModelName}/:id
// @access  Public
const delete${modelName} = asyncHandler(async (req, res) => {
  const ${lowerCaseModelName} = await ${modelName}.findById(req.params.id);

  if (${lowerCaseModelName}) {
    await ${modelName}.deleteOne({ _id: req.params.id });
    res.json({ message: '${modelName} removed' });
  } else {
    res.status(404);
    throw new Error('${modelName} not found');
  }
});

export {
  get${modelName}s,
  get${modelName}ById,
  create${modelName},
  update${modelName},
  delete${modelName},
};
`;
    }

    _templateBackendApiRoutes(routes) {
        const controllerImports = new Set();
        const routeDefinitions = routes.map(route => {
            const modelName = this._getModelNameFromRouteHandler(route.handler);
            const controllerName = modelName ? `${modelName.toLowerCase()}Controller` : null;
            if (controllerName) {
                controllerImports.add(`import * as ${controllerName} from '../controllers/${controllerName}.js';`);
            }

            const handlerMethod = this._getHandlerMethodFromRouteHandler(route.handler);

            if (!controllerName || !handlerMethod) {
                return `router.${route.method.toLowerCase()}('${route.path}', (req, res) => res.send('TODO: Implement ${route.handler}'));`;
            }

            const routePath = route.path.startsWith('/api') ? route.path.substring(4) : route.path; // Remove /api prefix if present, as router is already /api
            return `router.${route.method.toLowerCase()}('${routePath}', ${controllerName}.${handlerMethod});`;
        }).join('\n');

        return `
import express from 'express';
${Array.from(controllerImports).join('\n')}

const router = express.Router();

${routeDefinitions}

export default router;
`;
    }
}

export default CodeGenerator;
```