//Allowing multiple instagram pages into the same application
let _pageName = '';

/**
 * Sets the current Instagram page name for multi-page support.
 * @param {string} name - The Instagram page name to set
 */
const setPageName = (name) => {
  _pageName = name;
}

/**
 * Finds an environment variable with multi-page support.
 * First tries to find a page-specific variable (NAME_pageName), then falls back to the generic variable (NAME).
 * @param {string} name - The base name of the environment variable
 * @returns {string|undefined} The environment variable value, or undefined if not found
 */
const findEnvVariable = (name) => {
  return process.env[name + '_' + _pageName] ?? process.env[name]
}

module.exports = {
  setPageName,
  findEnvVariable
}

