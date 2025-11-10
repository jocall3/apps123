```javascript
import CodeGenerator from '../../src/codegen/CodeGenerator';
import fs from 'fs/promises';
import path from 'path';

// Mock templating engine for consistent and predictable behavior
// This mock simulates a basic templating engine that replaces {{key}} with data[key]
const mockTemplatingEngine = {
    compile: jest.fn((templateString) => {
        // Return a function that represents the compiled template
        const compiledFunction = jest.fn((data) => {
            let rendered = templateString;
            // Iterate over data keys and replace placeholders in the template string
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    // Use a regular expression to find all occurrences of {{key}}
                    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(data[key]));
                }
            }
            return rendered;
        });
        return compiledFunction;
    })
};

// Mock fs/promises for file reading operations
// This prevents actual file system access during tests, making them faster and more isolated.
const mockFiles = {}; // Stores { 'full/path/to/template.hbs': 'template content' }
jest.mock('fs/promises', () => ({
    readFile: jest.fn((filePath, encoding) => {
        if (mockFiles[filePath]) {
            return Promise.resolve(mockFiles[filePath]);
        }
        // Simulate 'file not found' error
        const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
        error.code = 'ENOENT';
        return Promise.reject(error);
    }),
}));

// Mock path.join for consistent path resolution in tests
// This ensures that path string concatenations are predictable, regardless of OS.
jest.mock('path', () => ({
    // A simple join that concatenates arguments with '/' and filters out empty strings
    join: jest.fn((...args) => args.filter(Boolean).join('/')),
    // Other path methods are mocked if the CodeGenerator might use them
    resolve: jest.fn((...args) => args.filter(Boolean).join('/')),
    dirname: jest.fn((p) => p.split('/').slice(0, -1).join('/')),
    basename: jest.fn((p) => p.split('/').pop()),
}));

describe('CodeGenerator', () => {
    // Define a constant root path for templates within the mock file system
    const TEMPLATE_ROOT = '/app/templates';
    let codeGenerator;

    beforeEach(() => {
        // Clear mock file system contents and reset all mock functions before each test
        for (const key in mockFiles) {
            delete mockFiles[key];
        }
        jest.clearAllMocks();

        // Initialize a new CodeGenerator instance for each test
        codeGenerator = new CodeGenerator(TEMPLATE_ROOT, mockTemplatingEngine);
    });

    // Helper function to add a template file to our mock file system
    const addMockTemplate = (relativePath, content) => {
        const fullPath = path.join(TEMPLATE_ROOT, relativePath);
        mockFiles[fullPath] = content;
    };

    test('should generate file content from a simple template with provided data', async () => {
        const templatePath = 'component.hbs';
        const templateContent = 'const {{name}} = () => <p>{{message}}</p>;';
        addMockTemplate(templatePath, templateContent);

        const data = { name: 'MyComponent', message: 'Hello from component!' };
        const expectedOutput = 'const MyComponent = () => <p>Hello from component!</p>;';

        const result = await codeGenerator.generateFileContent(templatePath, data);

        expect(result).toBe(expectedOutput);
        // Verify that fs.readFile was called with the correct full path
        expect(fs.readFile).toHaveBeenCalledWith(path.join(TEMPLATE_ROOT, templatePath), 'utf-8');
        // Verify that the templating engine's compile method was called with the template content
        expect(mockTemplatingEngine.compile).toHaveBeenCalledWith(templateContent);
        // Verify that the compiled template function was called with the data
        expect(mockTemplatingEngine.compile.mock.results[0].value).toHaveBeenCalledWith(data);
    });

    test('should handle templates with no placeholders and return static content', async () => {
        const templatePath = 'static.txt';
        const templateContent = 'This is static content.';
        addMockTemplate(templatePath, templateContent);

        const data = {}; // No data needed for static template
        const expectedOutput = 'This is static content.';

        const result = await codeGenerator.generateFileContent(templatePath, data);

        expect(result).toBe(expectedOutput);
        expect(fs.readFile).toHaveBeenCalledTimes(1);
        expect(mockTemplatingEngine.compile).toHaveBeenCalledWith(templateContent);
    });

    test('should gracefully handle missing data for placeholders (replace with empty string)', async () => {
        const templatePath = 'optional.js';
        const templateContent = 'const val = "{{value}}"; const other = "{{missing}}";';
        addMockTemplate(templatePath, templateContent);

        const data = { value: 'present' };
        // Our mock templating engine replaces missing keys with an empty string
        const expectedOutput = 'const val = "present"; const other = "";';

        const result = await codeGenerator.generateFileContent(templatePath, data);

        expect(result).toBe(expectedOutput);
    });

    test('should throw an error if the template file does not exist (ENOENT)', async () => {
        const templatePath = 'non-existent.hbs';
        const data = { name: 'Test' };

        // Expect the promise to reject with an error containing "Template not found"
        await expect(codeGenerator.generateFileContent(templatePath, data)).rejects.toThrow('Template not found');
        expect(fs.readFile).toHaveBeenCalledWith(path.join(TEMPLATE_ROOT, templatePath), 'utf-8');
        // The templating engine should not be called if the file could not be read
        expect(mockTemplatingEngine.compile).not.toHaveBeenCalled();
    });

    test('should cache compiled templates to avoid redundant file reads and compilations', async () => {
        const templatePath = 'cached.js';
        const templateContent = 'console.log("{{message}}");';
        addMockTemplate(templatePath, templateContent);

        const data1 = { message: 'First call' };
        const data2 = { message: 'Second call' };

        // Call generateFileContent twice with the same template but different data
        await codeGenerator.generateFileContent(templatePath, data1);
        await codeGenerator.generateFileContent(templatePath, data2);

        // fs.readFile should only be called once for the same template path
        expect(fs.readFile).toHaveBeenCalledTimes(1);
        expect(fs.readFile).toHaveBeenCalledWith(path.join(TEMPLATE_ROOT, templatePath), 'utf-8');

        // mockTemplatingEngine.compile should also only be called once
        expect(mockTemplatingEngine.compile).toHaveBeenCalledTimes(1);

        // The *result* of compile (the compiled function) should be called multiple times
        const compiledFn = mockTemplatingEngine.compile.mock.results[0].value;
        expect(compiledFn).toHaveBeenCalledTimes(2);
        expect(compiledFn).toHaveBeenCalledWith(data1);
        expect(compiledFn).toHaveBeenCalledWith(data2);
    });

    test('should handle various data types (numbers, booleans) correctly', async () => {
        const templatePath = 'types.js';
        const templateContent = `const num = {{count}}; const active = {{isActive}}; const price = {{price}};`;
        addMockTemplate(templatePath, templateContent);

        const data = { count: 123, isActive: true, price: 99.99 };
        const expectedOutput = `const num = 123; const active = true; const price = 99.99;`;

        const result = await codeGenerator.generateFileContent(templatePath, data);
        expect(result).toBe(expectedOutput);
    });

    test('should handle template paths containing subdirectories', async () => {
        const templatePath = 'subdir/nested-component.hbs';
        const templateContent = 'Component in subdir: {{name}}';
        addMockTemplate(templatePath, templateContent);

        const data = { name: 'NestedComponent' };
        const expectedOutput = 'Component in subdir: NestedComponent';

        const result = await codeGenerator.generateFileContent(templatePath, data);

        expect(result).toBe(expectedOutput);
        // Verify path.join mock correctly created the full path for fs.readFile
        expect(fs.readFile).toHaveBeenCalledWith(path.join(TEMPLATE_ROOT, templatePath), 'utf-8');
    });

    test('should propagate file system errors other than "ENOENT"', async () => {
        const templatePath = 'permission-denied.hbs';
        const fullPath = path.join(TEMPLATE_ROOT, templatePath);
        const mockError = new Error('EACCES: permission denied, open \'/app/templates/permission-denied.hbs\'');
        mockError.code = 'EACCES'; // Simulate a permission error

        // Temporarily override fs.readFile mock for this specific test case
        (fs.readFile).mockImplementationOnce((filePath) => {
            if (filePath === fullPath) {
                return Promise.reject(mockError);
            }
            return Promise.resolve(mockFiles[filePath]); // Fallback for other files
        });

        // Expect the promise to reject with the specific permission error
        await expect(codeGenerator.generateFileContent(templatePath, {})).rejects.toThrow('EACCES: permission denied');
        expect(fs.readFile).toHaveBeenCalledWith(fullPath, 'utf-8');
        // The templating engine should not be called in case of a file system error
        expect(mockTemplatingEngine.compile).not.toHaveBeenCalled();
    });
});
```