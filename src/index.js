var _           = require('lodash');
var fs          = require('fs-extra');
var path        = require('path');
var async       = require('async');
var pad         = require('pad');
var regen       = require('regen');
var website     = require('./website');
var thumbs      = require('./thumbs');

exports.build = function(opts) {

  opts = _.defaults(opts, {
    title: 'Photo gallery',
    thumbSize: 120,
    largeSize: 1000
  });

  opts.input = path.resolve(opts.input);
  opts.output = path.resolve(opts.output);

  thumbs.sizes.thumb = opts.thumbSize;
  thumbs.sizes.large = opts.largeSize;

  fs.mkdirp(opts.output);
  var media = path.join(opts.output, 'media');


  async.series([

    function staticWebsite(callback) {
      website.build(opts, callback);
    },

    buildStep('Original media', {
      cwd: opts.input,
      src: '**/*.{jpg,jpeg,png,mp4,mov}',
      dest: media + '/original/$path/$name.$ext',
      process: fs.copy
    }),

    buildStep('Photos (large)', {
      cwd: opts.input,
      src: '**/*.{jpg,jpeg,png}',
      dest: media + '/large/$path/$name.$ext',
      process: thumbs.photoLarge,
    }),

    buildStep('Photos (thumbs)', {
      cwd: opts.input,
      src: '**/*.{jpg,jpeg,png}',
      dest: media + '/thumbs/$path/$name.$ext',
      process: thumbs.photoSquare,
    }),

    buildStep('Videos (web)', {
      cwd: opts.input,
      src: '**/*.{mp4,mov}',
      dest: media + '/large/$path/$name.mp4',
      process: thumbs.videoWeb,
    }),

    buildStep('Videos (poster)', {
      cwd: opts.input,
      src: '**/*.{mp4,mov}',
      dest: media + '/large/$path/$name.jpg',
      process: thumbs.videoLarge,
    }),

    buildStep('Videos (thumbs)', {
      cwd: opts.input,
      src: '**/*.{mp4,mov}',
      dest: media + '/thumbs/$path/$name.jpg',
      process: thumbs.videoSquare,
    })

  ], finish);

};


function buildStep(message, opts) {
  return function(callback) {
    regen(_.extend(opts, {
      report: pad(message, 20) + '$progress'
    }), callback);
  }
}

function finish(err) {
  console.log();
  console.log(err || 'Gallery generated successfully');
  console.log();
  process.exit(err ? 1 : 0)
}
