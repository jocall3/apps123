import fs from 'fs/promises';
import path from 'path';

/**
 * Reads the content of a file.
 * @param {string} filePath The path to the file.
 * @param {string} [encoding='utf8'] The character encoding to use.
 * @returns {Promise<string>} A promise that resolves with the file's content.
 * @throws {Error} If the file cannot be read.
 */
export async function readFile(filePath, encoding = 'utf8') {
  try {
    const content = await fs.readFile(filePath, { encoding });
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Writes content to a file. If the file does not exist, it will be created.
 * Parent directories will be created if they don't exist.
 * @param {string} filePath The path to the file.
 * @param {string | Buffer} content The content to write.
 * @param {string} [encoding='utf8'] The character encoding to use.
 * @returns {Promise<void>} A promise that resolves when the file has been written.
 * @throws {Error} If the file cannot be written.
 */
export async function writeFile(filePath, content, encoding = 'utf8') {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, { encoding });
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
}

/**
 * Creates a new directory. Parent directories will be created if they don't exist.
 * @param {string} dirPath The path to the directory to create.
 * @returns {Promise<void>} A promise that resolves when the directory has been created.
 * @throws {Error} If the directory cannot be created.
 */
export async function createDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Deletes a file.
 * @param {string} filePath The path to the file to delete.
 * @returns {Promise<void>} A promise that resolves when the file has been deleted.
 * @throws {Error} If the file cannot be deleted.
 */
export async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore ENOENT (file not found) error, as the goal is for the file not to exist.
    if (error.code !== 'ENOENT') {
      console.error(`Error deleting file ${filePath}:`, error);
      throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }
}

/**
 * Deletes a directory, including its contents (recursively).
 * @param {string} dirPath The path to the directory to delete.
 * @returns {Promise<void>} A promise that resolves when the directory has been deleted.
 * @throws {Error} If the directory cannot be deleted.
 */
export async function deleteDirectory(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore ENOENT (directory not found) error, as the goal is for the directory not to exist.
    if (error.code !== 'ENOENT') {
      console.error(`Error deleting directory ${dirPath}:`, error);
      throw new Error(`Failed to delete directory ${dirPath}: ${error.message}`);
    }
  }
}

/**
 * Checks if a file or directory exists at the given path.
 * @param {string} targetPath The path to check.
 * @returns {Promise<boolean>} A promise that resolves to true if the path exists, false otherwise.
 */
export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    // Re-throw other errors (e.g., permissions)
    console.error(`Error checking existence of path ${targetPath}:`, error);
    throw new Error(`Failed to check existence of path ${targetPath}: ${error.message}`);
  }
}

/**
 * Checks if the given path points to a directory.
 * @param {string} targetPath The path to check.
 *
 * @returns {Promise<boolean>} A promise that resolves to true if it's a directory, false otherwise.
 * @throws {Error} If an unexpected error occurs during stat.
 */
export async function isDirectory(targetPath) {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false; // Path does not exist, so it's not a directory.
    }
    console.error(`Error checking if ${targetPath} is a directory:`, error);
    throw new Error(`Failed to determine if ${targetPath} is a directory: ${error.message}`);
  }
}

/**
 * Checks if the given path points to a file.
 * @param {string} targetPath The path to check.
 * @returns {Promise<boolean>} A promise that resolves to true if it's a file, false otherwise.
 * @throws {Error} If an unexpected error occurs during stat.
 */
export async function isFile(targetPath) {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isFile();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false; // Path does not exist, so it's not a file.
    }
    console.error(`Error checking if ${targetPath} is a file:`, error);
    throw new Error(`Failed to determine if ${targetPath} is a file: ${error.message}`);
  }
}

/**
 * Lists the names of files and directories inside a given directory.
 * @param {string} dirPath The path to the directory to list.
 * @returns {Promise<string[]>} A promise that resolves with an array of names.
 * @throws {Error} If the directory cannot be read.
 */
export async function listDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath);
    return entries;
  } catch (error) {
    console.error(`Error listing directory ${dirPath}:`, error);
    throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Copies a file from a source path to a destination path.
 * Parent directories for the destination will be created if they don't exist.
 * @param {string} sourcePath The path of the file to copy.
 * @param {string} destinationPath The path where the file should be copied.
 * @returns {Promise<void>} A promise that resolves when the file has been copied.
 * @throws {Error} If the file cannot be copied.
 */
export async function copyFile(sourcePath, destinationPath) {
  try {
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(sourcePath, destinationPath);
  } catch (error) {
    console.error(`Error copying file from ${sourcePath} to ${destinationPath}:`, error);
    throw new Error(`Failed to copy file from ${sourcePath} to ${destinationPath}: ${error.message}`);
  }
}

/**
 * Moves or renames a file or directory from a source path to a destination path.
 * Parent directories for the destination will be created if they don't exist.
 * @param {string} sourcePath The path of the file or directory to move.
 * @param {string} destinationPath The new path for the file or directory.
 * @returns {Promise<void>} A promise that resolves when the item has been moved.
 * @throws {Error} If the item cannot be moved.
 */
export async function moveFile(sourcePath, destinationPath) {
  try {
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.rename(sourcePath, destinationPath);
  } catch (error) {
    console.error(`Error moving file/directory from ${sourcePath} to ${destinationPath}:`, error);
    throw new Error(`Failed to move file/directory from ${sourcePath} to ${destinationPath}: ${error.message}`);
  }
}

/**
 * Renames a file or directory.
 * @param {string} oldPath The current path of the file or directory.
 * @param {string} newPath The new path for the file or directory.
 * @returns {Promise<void>} A promise that resolves when the item has been renamed.
 * @throws {Error} If the item cannot be renamed.
 */
export async function renamePath(oldPath, newPath) {
  try {
    await fs.rename(oldPath, newPath);
  } catch (error) {
    console.error(`Error renaming path from ${oldPath} to ${newPath}:`, error);
    throw new Error(`Failed to rename path from ${oldPath} to ${newPath}: ${error.message}`);
  }
}

export default {
  readFile,
  writeFile,
  createDirectory,
  deleteFile,
  deleteDirectory,
  pathExists,
  isDirectory,
  isFile,
  listDirectory,
  copyFile,
  moveFile,
  renamePath,
};