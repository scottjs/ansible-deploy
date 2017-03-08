#!/usr/bin/env node
var chalk = require('chalk');
var inquirer = require('inquirer');
var fs = require('fs-extra');
var path = require('path');

var src = path.join(__dirname, '..', 'setup');
var dest = '.';

var files = [];
var environment = [
	{
		name: 'environment',
		type: 'input',
		message: 'Environment:',
		default: 'development'
	}
];

console.log('Setting up deploy scripts...');

inquirer.prompt(environment).then(function(args) {

	files = [
		{
			src: '/deploy/inventory/inventory',
			dest: '/ansible/deploy/' + args.environment + '/inventory',
			replacements: [
				{
					name: 'host',
					type: 'input',
					message: 'Server IP Address:',
					default: '127.0.0.1'
				},
				{
					name: 'port',
					type: 'input',
					message: 'Server SSH port:',
					default: '22'
				},
				{
					name: 'user',
					type: 'input',
					message: 'Server SSH user:',
					default: 'deploy'
				},
				{
					name: 'key',
					type: 'input',
					message: 'Server SSH private key:',
					default: '~/.ssh/id_rsa'
				}
			]
		},
		{
			src: '/deploy/vars/deploy_vars.yml',
			dest: '/ansible/deploy/vars/deploy_vars.yml',
			replacements: [
				{
					name: 'repository',
					type: 'input',
					message: 'Project git repository:',
					default: 'git@bitbucket.org:username/repository.git'
				}
			]
		},
		{
			src: '/deploy/inventory/group_vars/all.yml',
			dest: '/ansible/deploy/' + args.environment + '/group_vars/all.yml',
			replacements: [
				{
					name: 'deploy_to',
					type: 'input',
					message: 'Deploy to server directory:',
					default: '/var/www/html'
				},
				{
					name: 'deploy_from',
					type: 'input',
					message: 'Deploy from git branch:',
					default: 'develop'
				}
			]
		},
		{
			src: '/deploy/deploy.yml',
			dest: '/ansible/deploy/deploy.yml',
			replacements: []
		},
		{
			src: '/deploy/rollback.yml',
			dest: '/ansible/deploy/rollback.yml',
			replacements: []
		},
		{
			src: '/ansible.cfg',
			dest: '/ansible.cfg',
			replacements: []
		}
	];

	filePrompt();
});

function filePrompt(i) {
	i = typeof i !== 'undefined' ? i : 0;

	if(typeof files[i].replacements !== 'undefined') {
		var replacements = [];

		if(!fs.existsSync(dest + files[i].dest)) {
			replacements = files[i].replacements;
		}

		inquirer.prompt(replacements).then(function(args) {
			if(!fs.existsSync(dest + files[i].dest)) {
				fs.copySync(src + files[i].src, dest + files[i].dest);
				fileReplace(args, files[i]);

				console.log(chalk.green('Finished setting up ' + files[i].dest.substring(1) + '.'));
			}
			else {
				console.log(chalk.yellow('File already exists ' + files[i].dest.substring(1) + '.'));
			}

			filePrompt(i + 1);
		});
	}
}

function fileReplace(args, file) {
	fs.readFile(dest + file.dest, 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}

		var result = data;
		var replacements = Object.keys(args);

		for(i in replacements) {
			var replacement = replacements[i];
			var regex = new RegExp('\\$' + replacement.toUpperCase() + '\\$', 'g');

			result = result.replace(regex, args[replacement]);
		}

		fs.writeFile(dest + file.dest, result, 'utf8', function (err) {
			if (err) {
				return console.log(err);
			}
		});
	});
}