var pathFn = require('path');
var fs = require('hexo-fs');
var chalk = require('chalk');
var swig = require('swig');
var moment = require('moment');
var util = require('hexo-util');
var spawn = util.spawn;

var swigHelpers = {
  now: function(format){
    return moment().format(format);
  }
};

module.exports = function(args){
  var baseDir = this.base_dir;
  var log = this.log;
  var message = commitMessage(args);
  var verbose = !args.silent;

  if (!args.repo && !args.repository){
    var help = '';

    help += 'You have to configure the deployment settings in _config.yml first!\n\n';
    help += 'Example:\n';
    help += '  deploy:\n';
    help += '    type: heroku\n';
    help += '    repo: <repository url>\n';
    help += '    message: [message]\n\n';
    help += 'For more help, you can check the docs: ' + chalk.underline('http://hexo.io/docs/deployment.html');

    console.log(help);
    return;
  }

  function git(){
    var len = arguments.length;
    var args = new Array(len);

    for (var i = 0; i < len; i++){
      args[i] = arguments[i];
    }

    return spawn('git', args, {
      cwd: baseDir,
      verbose: verbose
    });
  }

  function setup(){
    var packagePath = pathFn.join(baseDir, 'package.json');

    // Check whether Git is initialized
    return fs.exists(pathFn.join(baseDir, '.git')).then(function(exist){
      if (exist) return;

      // Initialize Git
      log.info('Setting up Git environment...');
      return git('init');
    }).then(function(){
      // Read package.json
      return fs.readFile(packagePath);
    }).then(function(content){
      var pkg = JSON.parse(content);

      if (!pkg.scripts) pkg.scripts = {};
      if (!pkg.scripts.start) pkg.scripts.start = 'superstatic public --port $PORT';

      if (!pkg.dependencies) pkg.dependencies = {};
      if (!pkg.dependencies.superstatic) pkg.dependencies.superstatic = '1.x';

      // Update package.json
      return fs.writeFile(packagePath, JSON.stringify(pkg, null, '  '));
    });
  }

  function push(repo){
    return git('add', '-A').then(function(){
      return git('commit', '-m', message).catch(function(){
        // Do nothing. It's OK if nothing to commit.
      });
    }).then(function(){
      return git('push', '-u', repo, 'master', '--force');
    });
  }

  return setup().then(function(){
    return push(args.repo || args.repository);
  });
};

function commitMessage(args){
  var message = args.m || args.msg || args.message || 'Site updated: {{ now(\'YYYY-MM-DD HH:mm:ss\') }}';
  return swig.compile(message)(swigHelpers);
}