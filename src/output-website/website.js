var _           = require('lodash');
var fs          = require('fs-extra');
var path        = require('path');
var async       = require('async');
var pad         = require('pad');
var less        = require('less');
var files       = require('../utils/files');
var Album       = require('../model/album');
var byFolder    = require('../model//by-folder');
var byDate      = require('../model//by-date');
var template    = require('./template');

var DIR_PUBLIC = path.join(__dirname, '..', '..', 'public');
var DIR_TEMPLATES = path.join(__dirname, '..', '..', 'templates');

exports.build = function(rootAlbum, opts, callback) {

  // create the right renderer (theme, download path, etc...)
  var renderer = template.create(opts);

  function website(callback) {
    // create top level gallery
    var gallery = {
      home: rootAlbum,
      css: opts.css ? path.basename(opts.css) : null,
      title: opts.title,
      titleWords: opts.title.split(' '),
      thumbSize: opts.thumbSize,
      largeSize: opts.largeSize,
      googleAnalytics: opts.googleAnalytics
    };
    // render entire album hierarchy
    var tasks = renderAlbum(gallery, [], rootAlbum);
    async.parallel(tasks, callback);
  }

  function renderAlbum(gallery, breadcrumbs, album) {
    // render this album
    var thisAlbumTask = renderTemplate(path.join(album.folder, album.filename), 'album', {
      gallery: gallery,
      breadcrumbs: breadcrumbs,
      album: album
    });
    var tasks = [thisAlbumTask];
    // and all nested albums
    album.albums.forEach(function(nested) {
      var nestedAlbumsTasks = renderAlbum(gallery, breadcrumbs.concat([album]), nested);
      Array.prototype.push.apply(tasks, nestedAlbumsTasks);
    });
    return tasks;
  }

  function renderTemplate(filename, templateName, data) {
    // render a given HBS template
    var baseDir = path.dirname(filename);
    var fullPath = path.join(opts.output, filename);
    return function(next) {
      var contents = renderer.render(templateName, data, baseDir);
      fs.mkdirsSync(path.dirname(fullPath));
      fs.writeFile(fullPath, contents, next);
    };
  }

  function support(callback) {
    var dest = path.join(opts.output, 'public');
    fs.copy(DIR_PUBLIC, dest, callback);
  }

  function lightGallery(callback) {
    // note: this module might be deduped
    // so we can't assume it's in the local node_modules
    var lgPackage = require.resolve('lightgallery/package.json');
    var src = path.join(path.dirname(lgPackage), 'dist');
    var dest = path.join(opts.output, 'public', 'light-gallery');
    fs.copy(src, dest, callback);
  }

  function renderStyles(callback) {
    var themeFile = path.join(DIR_TEMPLATES, 'themes', opts.theme, 'theme.less');
    var themeLess = fs.readFileSync(themeFile, 'utf-8');
    if (opts.css) {
      themeLess += '\n' + fs.readFileSync(opts.css, 'utf-8');
    }
    less.render(themeLess, function (err, output) {
      if (err) return callback(err);
      var dest = path.join(opts.output, 'public', 'style.css');
      fs.writeFile(dest, output.css, callback);
    });
  }

  async.series([
    support,
    website,
    lightGallery,
    renderStyles
  ], function(err) {
    callback(err);
  });

};
