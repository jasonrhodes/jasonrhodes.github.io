var gulp = require('gulp')
  , connect = require('gulp-connect')
  , moment = require('moment')
  , metalsmith = require('metalsmith')
  , markdown = require('metalsmith-markdown')
  , templates = require('metalsmith-templates')
  , collections = require('metalsmith-collections')
  , paginate = require('metalsmith-paginate')
  , permalinks = require('metalsmith-permalinks')
  , branch = require('metalsmith-branch')
  ;

function plumber() {
  return function plmbr(files, metalsmith, done) {
    console.log('====== FILES =======');
    console.log(files);
    console.log('====== METADATA =======');
    console.log(metalsmith.metadata());
    done();
  };
}

function formatDate(files, metalsmith, done) {
  for (file in files) {
    files[file].date = moment(files[file].date).format('D MMMM YYYY');
  }
  done();
}

gulp.task('build', function () {

  return metalsmith(__dirname)
    
    .source('src')
    .destination('build')

    // .use(drafts())

    // Break into collections on patterns
    // (each collection available as top level property in templates)
    .use(collections({
      posts: {
        pattern: 'blog/*.md',
        sortBy: 'date',
        reverse: true
      }
    }))

    .use(paginate({
      perPage: 1,
      path: "blog/page"
    }))

    // Parse markdown
    .use(markdown({
      smartypants: true,
      gfm: true,
      tables: true
    }))

    // Only apply to following pattern
    .use(branch('blog/*')
      .use(permalinks({
        pattern: 'blog/:date-:title',
        date: 'YYYY-MM-DD'
      }))
      .use(formatDate)
    )

    // Apply jade templates
    .use(templates('jade'))

    .build(function (err) {
      if (err) console.error(err);
    });

});

gulp.task('serve', function () {

  return connect.server({
    host: '0.0.0.0',
    port: 6060,
    root: 'build'
  });

});

gulp.task('watch', ['build'], function () {
  gulp.watch(['src/**/*', 'templates/**/*.jade'], ['build']);
});

gulp.task('default', ['serve', 'watch']);