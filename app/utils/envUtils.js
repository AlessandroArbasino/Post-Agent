//Allowing multiple instagram pages into the same application
let _pageName = '';

function setPageName(name) {
  _pageName = name;
}

function findEnvVariable(name) {
  return process.env[name+'_'+_pageName] ?? process.env[name] 
}

module.exports = {
  setPageName,
  findEnvVariable
}

