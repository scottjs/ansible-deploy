#!/usr/bin/env node
var chalk = require('chalk');

console.log('To use this script make sure that the following is added to your package.json scripts block...\n');
console.log(chalk.cyan('"scripts": {\n  "setup-deploy":"setup-deploy-config"\n}'));
console.log('\nThen run ' + chalk.cyan('npm run setup-deploy') + ' to start the setup.\n');
