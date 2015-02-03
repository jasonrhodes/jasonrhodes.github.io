var grunt     = require('grunt');
var path      = require('path');
var jade      = require('jade');
var fs        = require('fs');
var Pagemaki  = require('pagemaki');
var _         = require('lodash');
var moment    = require('moment');

var maker = new Pagemaki();

var templates = {
  post: jade.compileFile('./views/post.jade', { pretty: true }),
  page: jade.compileFile('./views/page.jade', { pretty: true }),
  home: jade.compileFile('./views/home.jade', { pretty: true }),
  'blog-home': jade.compileFile('./views/blog-home.jade', { pretty: true })
};

var postList = fs.readdirSync('src/blog').filter(function (post) {
  return post !== 'index.md';
}).map(function (post) { 
  var data = maker.parse(fs.readFileSync('src/blog/' + post).toString());
  data.prettyDate = moment(data.date).format('YYYY-MM-DD');
  delete data.content;
  data.url = '/blog/' + post.replace(/md$/, 'html');
  return data;
});

grunt.loadNpmTasks('grunt-markdown');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-connect');
grunt.loadNpmTasks('grunt-contrib-clean');

function removeSrc(dest, src) {
  return path.join(dest, src.replace(/^src(\/pages)?/, ''));
}

function getProcessor(defaultTemplate) {
  return function (content, srcpath) {
    var parsed = maker.parse(content);
    var template = parsed.template || defaultTemplate;
    
    parsed.posts = postList;
    parsed.bylineDate = moment(parsed.date).format('MMMM Do, YYYY');
    var current = _.findIndex(postList, { title: parsed.title });
    parsed.prev = (current - 1) > -1 ? postList[current - 1] : false;
    parsed.next = (current + 1) < postList.length ? postList[current + 1] : false;

    return templates[template](parsed).trim() + '\n';
  }
}

grunt.initConfig({
  copy: {
    css: {
      files: [
        {
          expand: true,
          src: 'src/assets/**/*.css',
          dest: '.',
          rename: removeSrc
        }
      ]
    },
    js: {
      files: [
        {
          expand: true,
          src: 'src/assets/**/*.js',
          dest: '.',
          rename: removeSrc
        }
      ]
    },
    posts: {
      expand: true,
      src: 'src/blog/**/*.md',
      dest: '.',
      ext: '.html',
      rename: removeSrc,
      options: {
        process: getProcessor('post')
      }
    },
    pages: {
      expand: true,
      src: 'src/pages/**/*.md',
      dest: '.',
      ext: '.html',
      rename: removeSrc,
      options: {
        process: getProcessor('page')
      }
    }
  },
  watch: {
    posts: {
      files: 'src/blog/**/*.md',
      tasks: ['clean:posts', 'copy:posts'],
      options: {
        livereload: true
      }
    },
    pages: {
      files: 'src/pages/**/*.md',
      tasks: ['clean:pages', 'copy:pages'],
      options: {
        livereload: true
      }
    },
    templates: {
      files: 'views/**/*.jade',
      tasks: ['copy:posts', 'copy:pages'],
      options: {
        livereload: true
      }
    },
    css: {
      files: 'src/assets/**/*.css',
      tasks: ['clean:css', 'copy:css'],
      options: {
        livereload: true
      }
    },
    js: {
      files: 'src/assets/**/*.js',
      tasks: ['clean:js', 'copy:js'],
      options: {
        livereload: true
      }
    }
  },
  connect: {
    server: {
      options: {
        port: 4000,
        hostname: 'localhost',
        livereload: true,
        open: true
      }
    }
  },
  clean: {
    posts: ['blog'],
    pages: fs.readdirSync('src/pages').map(function (file) { 
      return file.replace(/\.md$/, '.html'); 
    }),
    css: ['assets/css'],
    js: ['assets/js']
  }
});

grunt.registerTask('build', ['clean', 'copy']);
grunt.registerTask('default', ['build', 'connect:server', 'watch']);