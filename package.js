Package.describe({
  name: 'matteodem:easy-security',
  summary: 'Protection against harmful attacks by rate limiting all remote method calls ',
  version: '0.1.0',
  git: 'https://github.com/matteodem/meteor-easy-security.git'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.0');

  api.addFiles('lib/easy-security.js');
  api.addFiles('lib/server.js', 'server');

  api.use(['ddp', 'underscore', 'random']);

  api.export('EasySecurity');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('matteodem:easy-security');
  api.addFiles('easy-security-tests.js');
});
