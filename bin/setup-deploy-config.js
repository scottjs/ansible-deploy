#!/usr/bin/env node
var chalk = require('chalk');
var inquirer = require('inquirer');
var fs = require('fs-extra');
var path = require('path');

// Ansible directories
var ansibleParent = './ansible';
var ansibleDest = ansibleParent + '/deploy';
var setupFiles = path.join(__dirname, '..', 'setup');

// Deploy script paths
var deployScriptSrc = setupFiles + '/deploy/deploy.yml';
var deployScriptDest = ansibleDest + '/deploy.yml';

// Rollback script paths
var rollbackScriptSrc = setupFiles + '/deploy/rollback.yml';
var rollbackScriptDest = ansibleDest + '/rollback.yml';

// Deploy vars script paths
var deployVarsDest = ansibleDest + '/vars';
var deployVarsScriptSrc = setupFiles + '/deploy/vars/deploy_vars.yml';
var deployVarsScriptDest = ansibleDest + '/vars/deploy_vars.yml';

// Inventory paths
var inventorySrc = setupFiles + '/deploy/inventory';

// Ansible config paths
var ansibleCfgSrc = setupFiles + '/ansible.cfg';
var ansibleCfgDest = './ansible.cfg';

function deploymentPrompt(callback) {
	var questions = [];

	if(!fs.existsSync(deployVarsScriptDest)) {
		questions.push(
			{
				name: 'repo',
				type: 'input',
				message: 'Project git repository:',
				default: 'git@bitbucket.org:username/repository.git',
				validate: function( value ) {
					if (value.length) {
						return true;
					} else {
						return 'Please enter the project git repository';
					}
				}
			},
			{
				name: 'notify',
				type: 'input',
				message: 'Notification email addresses:',
				default: 'user1@domain.com, user2@domain.com',
				validate: function( value ) {
					if (value.length) {
						return true;
					} else {
						return 'Please enter the notification email addresses';
					}
				}
			}
		);
	}

	inquirer.prompt(questions).then(callback);
}

function environmentPrompt(callback) {
	var questions = [];

	questions.push(
		{
			name: 'target',
			type: 'input',
			message: 'Create a new deployment environment:',
			default: 'development',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the deployment environment name';
				}
			}
		}
	);

	inquirer.prompt(questions).then(callback);
}

function projectPrompt(callback) {
	var questions = [];

	questions.push(
		{
			name: 'host',
			type: 'input',
			message: 'Server IP Address:',
			default: '127.0.0.1',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the server IP address';
				}
			}
		},
		{
			name: 'port',
			type: 'input',
			message: 'Server SSH port:',
			default: '22',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the server SSH port';
				}
			}
		},
		{
			name: 'user',
			type: 'input',
			message: 'Server SSH user:',
			default: 'deploy',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the server SSH user';
				}
			}
		},
		{
			name: 'key',
			type: 'input',
			message: 'Server SSH private key:',
			default: '~/.ssh/id_rsa',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the server SSH private key';
				}
			}
		},
		{
			name: 'deploy_to',
			type: 'input',
			message: 'Deploy to server directory:',
			default: '/var/www/html',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the server deployment directory';
				}
			}
		},
		{
			name: 'deploy_from',
			type: 'input',
			message: 'Deploy from git branch:',
			default: 'develop',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the git branch to deploy from';
				}
			}
		}
	);

	inquirer.prompt(questions).then(callback);
}

console.log('Setting up deployment scripts...');

deploymentPrompt(function(arguments){

	if(!fs.existsSync(ansibleParent)) {
		fs.mkdirSync(ansibleParent);
	}

	if(!fs.existsSync(ansibleDest)) {
		console.log(chalk.green('Creating deploy directory...'));
		fs.mkdirSync(ansibleDest);
	}

	if(!fs.existsSync(deployVarsDest)) {
		console.log(chalk.green('Creating deploy vars directory...'));
		fs.mkdirSync(deployVarsDest);
	}

	if(!fs.existsSync(deployVarsScriptDest)) {
		console.log(chalk.green('Creating deploy vars file...'));
		fs.copySync(deployVarsScriptSrc, deployVarsScriptDest);

		var repo = arguments.repo;
		var notify = arguments.notify;

		fs.readFile(deployVarsScriptDest, 'utf8', function (err,data) {
			if (err) {
				return console.log(err);
			}

			var result = data
				.replace(/\$REPOSITORY\$/g, repo)
				.replace(/\$NOTIFY_USERS\$/g, notify);

			fs.writeFile(deployVarsScriptDest, result, 'utf8', function (err) {
				if (err) return console.log(err);
			});
		});
	}
	else {
		console.log(chalk.yellow('Deploy vars file already exists...'));
	}

	if(!fs.existsSync(deployScriptDest)) {
		console.log(chalk.green('Creating deploy file...'));
		fs.copySync(deployScriptSrc, deployScriptDest);
	}
	else {
		console.log(chalk.yellow('Deploy file already exists...'));
	}

	if(!fs.existsSync(rollbackScriptDest)) {
		console.log(chalk.green('Creating rollback file...'));
		fs.copySync(rollbackScriptSrc, rollbackScriptDest);
	}
	else {
		console.log(chalk.yellow('Rollback file already exists...'));
	}

	if(!fs.existsSync(ansibleCfgDest)) {
		console.log(chalk.green('Creating ansible config file...'));
		fs.copySync(ansibleCfgSrc, ansibleCfgDest);
	}
	else {
		console.log(chalk.yellow('Ansible config file already exists...'));
	}

	console.log('Setting up deployment environments...');

	environmentPrompt(function(arguments){

		if(!fs.existsSync(ansibleDest + '/' + arguments.target)) {
			console.log(chalk.green('Creating deployment environment config...'));
			fs.copySync(inventorySrc, ansibleDest + '/' + arguments.target);

			var environment = arguments.target;

			projectPrompt(function(arguments){

				var host = arguments.host;
				var port = arguments.port;
				var user = arguments.user;
				var key = arguments.key;
				var to = arguments.deploy_to;
				var from = arguments.deploy_from;

				fs.readFile(ansibleDest + '/' + environment + '/inventory', 'utf8', function (err,data) {
					if (err) {
						return console.log(err);
					}

					var result = data
						.replace(/\$HOST\$/g, host)
						.replace(/\$PORT\$/g, port)
						.replace(/\$USER\$/g, user)
						.replace(/\$KEY\$/g, key);

					fs.writeFile(ansibleDest + '/' + environment + '/inventory', result, 'utf8', function (err) {
						if (err) return console.log(err);
					});
				});

				fs.readFile(ansibleDest + '/' + environment + '/group_vars/all.yml', 'utf8', function (err,data) {
					if (err) {
						return console.log(err);
					}

					var result = data
						.replace(/\$DEPLOY_TO\$/g, to)
						.replace(/\$DEPLOY_FROM\$/g, from);

					fs.writeFile(ansibleDest + '/' + environment + '/group_vars/all.yml', result, 'utf8', function (err) {
						if (err) return console.log(err);
					});
				});

				console.log('Finished setting up deployment environment.');
			});
		}
		else {
			console.log(chalk.yellow('The environment "' + arguments.target + '" already exists...'));
		}

	});
});