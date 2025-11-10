# MetaGenius User Guide

## Welcome to MetaGenius!

MetaGenius is your ultimate AI-powered co-creator for building software. Imagine an application that doesn't just assist you, but can *write* entire applications based on your ideas. That's MetaGenius.

Whether you're a seasoned developer looking to accelerate your workflow, an entrepreneur bringing a new product to life, or someone with a brilliant idea but no coding background, MetaGenius empowers you to transform concepts into functional, production-ready applications with unprecedented speed and efficiency.

This guide will walk you through interacting with MetaGenius, from your first prompt to deploying your sophisticated applications.

---

## 1. Getting Started

### 1.1 Accessing MetaGenius

MetaGenius is accessible via its web-based interface. Simply navigate to `app.metagenius.ai` (or your provided URL) and log in with your credentials.

### 1.2 The Interface Overview

Upon logging in, you'll be greeted by the MetaGenius workspace, typically comprising:

*   **Prompt Input Area:** This is where you describe the application you want to build or the changes you want to make. (Usually a large text area)
*   **Response/Output Area:** Displays the generated code, explanations, and progress updates from MetaGenius.
*   **Project Explorer/File Tree:** (Optional, for managing existing projects) A panel showing the structure of your currently active application project.
*   **Controls:** Buttons for `Generate`, `Stop`, `Save`, `Export`, `Deploy`, and `Settings`.
*   **History/Session Log:** A sidebar or section showing your previous interactions and generated outputs.

---

## 2. Core Concepts

### 2.1 The Power of Prompts

The core of interacting with MetaGenius is through **prompts**. A prompt is a natural language instruction that tells MetaGenius what you want to achieve. Think of it as explaining your vision to an incredibly intelligent software engineer.

**Types of Prompts:**

*   **Initial Generation Prompts:** Describe an entirely new application.
*   **Modification/Extension Prompts:** Request changes or additions to an existing application.
*   **Debugging Prompts:** Ask MetaGenius to identify and fix issues.
*   **Refactoring Prompts:** Instruct MetaGenius to improve code quality, performance, or structure.
*   **Question Prompts:** Ask for explanations about the generated code or architecture.

### 2.2 Project Management

MetaGenius organizes your applications into **Projects**. Each project represents a complete codebase that can be iterated upon, saved, exported, and deployed.

*   **Creating a New Project:** Typically initiated by your first app generation prompt.
*   **Loading/Switching Projects:** Access via the "Projects" menu or sidebar.
*   **Saving Projects:** MetaGenius often auto-saves, but manual save options are available.

### 2.3 Iteration and Refinement

Building a complex application is rarely a one-shot process. MetaGenius is designed for **iterative development**.

*   After an initial generation, review the output.
*   Provide follow-up prompts to refine features, fix bugs, or add new functionality.
*   This back-and-forth conversation allows you to sculpt your application precisely.

---

## 3. How to Use MetaGenius: Step-by-Step

### 3.1 Generating Your First Application

Let's create a simple "To-Do List" application.

1.  **Navigate to a New Project:** Ensure you're starting a new project or an empty workspace.
2.  **Enter Your Prompt:** In the prompt input area, type a clear and descriptive request.

    ```
    Build a simple web-based To-Do List application.
    It should allow users to:
    - Add new tasks.
    - Mark tasks as complete.
    - Delete tasks.
    - View all tasks.
    Use modern web technologies like React for the frontend and Node.js with Express and a simple JSON file for persistence on the backend.
    ```
3.  **Click "Generate":** MetaGenius will process your request, generate the necessary code, and display it in the output area. This may take a few moments.
4.  **Review the Output:** Examine the generated code, file structure, and any accompanying explanations provided by MetaGenius. It might include setup instructions, API endpoints, or component details.
5.  **Test Locally:** Follow any instructions provided to run the application on your local machine to ensure it meets your initial requirements.

### 3.2 Modifying and Extending an Existing Application

Now, let's enhance our To-Do List app.

1.  **Ensure Project is Active:** Make sure your "To-Do List" project is loaded in MetaGenius.
2.  **Enter a Modification Prompt:**

    ```
    Add user authentication to the To-Do List application.
    Users should be able to:
    - Register with an email and password.
    - Log in and out.
    - Each user should only see their own tasks.
    Use JWT for authentication and add a simple in-memory user store for now.
    ```
3.  **Click "Generate":** MetaGenius will analyze your existing codebase and integrate the new authentication features, modifying relevant files (e.g., adding user routes, authentication middleware, updating task models).
4.  **Review and Test:** Check the updated code and test the new authentication flow.

### 3.3 Debugging and Refactoring

MetaGenius can also help you fix issues or improve your code.

**Example: Debugging**

1.  **Describe the Problem:**

    ```
    I'm encountering an issue where deleted tasks sometimes reappear after refreshing the page. The console shows a 404 error when trying to delete. Please investigate and fix this bug.
    ```
2.  **Click "Generate":** MetaGenius will analyze the code, identify potential causes (e.g., incorrect API endpoint, client-side state issue), and propose a fix.

**Example: Refactoring**

1.  **Request a Refactor:**

    ```
    Refactor the backend API endpoints to be more RESTful. Ensure consistent naming conventions and status codes.
    ```
2.  **Click "Generate":** MetaGenius will restructure your API routes and handlers to align with REST principles.

### 3.4 Exporting Your Code

Once you're satisfied with your application, you can export the full codebase.

1.  **Click "Export" / "Download":** This button is usually prominent in the interface.
2.  **Choose Format (if prompted):** Often, it will download as a `.zip` archive containing all project files.

### 3.5 Deploying Your Application

MetaGenius can often assist with deployment or provide deployment instructions.

1.  **Click "Deploy" (if available):** If MetaGenius has direct integrations (e.g., with Vercel, Netlify, AWS), you might be able to deploy directly from the interface.
2.  **Follow Instructions:** If direct deployment isn't available, MetaGenius will provide detailed `README.md` files or deployment scripts within your exported project that guide you through manual deployment to common platforms (e.g., using Docker, Heroku, AWS EC2, etc.).

---

## 4. Best Practices for Prompts

To get the most out of MetaGenius, craft clear, specific, and comprehensive prompts.

*   **Be Specific:** Instead of "Build an e-commerce app," say "Build an e-commerce platform for selling handmade jewelry, featuring product listings, a shopping cart, user accounts, and Stripe integration for payments."
*   **Define Technologies (Optional but Recommended):** Specify your preferred tech stack (e.g., "Use React, Node.js, Express, MongoDB").
*   **Outline Key Features:** List out the functionalities your application should have.
*   **Describe User Experience (UX):** "The user should have a smooth, intuitive checkout process."
*   **Provide Constraints/Requirements:** "The app must be mobile-responsive," "Use Tailwind CSS for styling."
*   **Break Down Complex Tasks:** For very large applications, start with core functionality and iterate.
*   **Use Follow-Up Prompts:** Don't try to cram everything into one giant prompt. Iterate and refine.
*   **Give Context:** When modifying, refer to existing features or files. "In the `UserService.js`, add a function to reset passwords."

---

## 5. Troubleshooting & Support

### 5.1 Common Issues

*   **Incomplete Generation:** If MetaGenius seems to stop midway, try refining your prompt to be clearer or break it down into smaller steps. Ensure your request isn't too ambiguous or overly complex for a single generation.
*   **Syntax Errors in Generated Code:** While rare, if you spot obvious syntax errors, provide a prompt like "There's a syntax error in `src/App.js` at line 25, please fix it."
*   **Logical Bugs:** If the application doesn't behave as expected, describe the exact steps to reproduce the bug in a debugging prompt.
*   **Slow Generation:** Complex requests can take longer. Ensure your internet connection is stable.

### 5.2 Reporting Bugs / Getting Help

If you encounter persistent issues, unexpected behavior, or need further assistance:

*   **Check the FAQ:** Refer to the frequently asked questions section on the MetaGenius website.
*   **Community Forum:** Visit our community forum at `community.metagenius.ai` to search for solutions or post your question.
*   **Contact Support:** For critical issues, reach out to our support team at `support@metagenius.ai`. Please include relevant details, your project ID, and the prompts you used.

---

Thank you for choosing MetaGenius. We're excited to see what you build!