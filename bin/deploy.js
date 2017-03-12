#!/usr/bin/env node
var chalk = require('chalk');
var inquirer = require('inquirer');
var cp = require('child_process');
var fs = require('fs');

// Setup paths
var dest = './ansible-deploy';

// Load in required parameters and optional assigned parameters
var args = process.argv.slice(2);
var params = [];
var total = 0;

// Display help
if(args[0] === 'help') {
	console.log(chalk.underline.bold('Deploy help') + '\n\n  Deploy help.\n\n' + chalk.underline.bold('Usage') + '\n\n  $ npm run deploy\n  $ npm run deploy <' + chalk.underline('environment') + '>\n  $ npm run deploy <' + chalk.underline('environment') + '> [<' + chalk.underline('branch|tag') + '>] [vault=<' + chalk.underline('vault') + '>]\n\n' + chalk.underline.bold('Options') + '\n\n  <' + chalk.underline('branch|tag') + '>\t\tOverride the branch or release to deploy to the environment.\n  vault=<' + chalk.underline('vault') + '>\t\tPath to vault password file.\n');
	process.exit();
}

// Start script
console.log('Setting up a deploy...');

for(i in args) {
	var item = args[i];

	if(item.indexOf('=') !== -1) {
		var parts = args[i].split('=');
		params[parts[0]] = parts[1];
	}
	else {
		params['arg' + total] = args[i];
		total++;
	}
}

// If no parameters are passed, ask the user for answers
if(typeof params['arg0'] === 'undefined') {
	var environments = [];

	// Get a list of configured environments
	if(fs.existsSync(dest)) {
		var files = fs.readdirSync(dest);
		for (var i in files) {
			if (fs.statSync(dest + '/' + files[i]).isDirectory() && files[i] !== 'vars') {
				environments.push(files[i]);
			}
		}
	}

	// If no environments exist yet
	if(environments.length === 0) {
		console.log(chalk.red('No environments setup'));
		process.exit();
	}

	// Setup questions
	var deploy = [
		{
			name: 'arg0',
			type: 'rawlist',
			message: 'Environment:',
			choices: environments
		},
		{
			name: 'vault',
			type: 'input',
			message: 'Vault:',
			default: typeof params['vault'] !== 'undefined' ? params['vault'] : 'leave blank if no vault setup'
		}
	];

	// Ask questions
	inquirer.prompt(deploy).then(function(params) {
		setup(params);
	});
}

// Otherwise use the params
else {
	setup(params);
}

/**
 * Start the ansible deploy with given args
 *
 * @param params Parameters from command line and/or prompt
 */
function setup(params) {

	// Ansible args to use
	var deployArgs = [
		'-i',
		'ansible-deploy/' + params['arg0'] + '/inventory',
		'ansible-deploy/deploy.yml'
	];

	// If vault params are sent, pass it into the ansible args
	if(typeof params['vault'] !== 'undefined' && params['vault'] !== 'leave blank if no vault setup') {
		deployArgs.push('--vault-password-file=' + params['vault']);
	}

	// Spawn the command
	cp.spawnSync('ansible-playbook', deployArgs, {stdio: 'inherit'});
}


