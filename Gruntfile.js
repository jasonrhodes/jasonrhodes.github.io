var grunt = require('grunt');
var path  = require('path');
var jade  = require('jade');

var templates = {
  post: jade.compileFile('./views/post.jade', { pretty: true }),
  page: jade.compileFile('./views/page.jade', { pretty: true })
};

grunt.loadNpmTasks('grunt-markdown');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-connect');

function removeSrc(dest, src) {
  return path.join(dest, src.replace(/^src(\/pages)?/, ''));
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
    }
  },
  markdown: {
    posts: {
      files: [
        {
          expand: true,
          src: 'src/blog/**/*.md',
          dest: '.',
          ext: '.html',
          rename: removeSrc
        }
      ],
      options: {
        autoTemplate: false,
        template: 'src/template.html',
        postCompile: function (content) {
          return templates.post({ content: '\n\n' + content }).trim() + '\n';
        }
      }
    },
    pages: {
      files: [
        {
          expand: true,
          src: 'src/pages/**/*.md',
          dest: '.',
          ext: '.html',
          rename: removeSrc
        }
      ],
      options: {
        autoTemplate: false,
        template: 'src/template.html',
        postCompile: function (content) {
          return templates.page({ content: '\n\n' + content }).trim() + '\n';
        }
      }
    }
  },
  watch: {
    posts: {
      files: 'src/posts/**/*.md',
      tasks: ['markdown:posts'],
      options: {
        livereload: true
      }
    },
    pages: {
      files: 'src/pages/**/*.md',
      tasks: ['markdown:pages'],
      options: {
        livereload: true
      }
    },
    css: {
      files: 'src/assets/**/*.css',
      tasks: 'copy:css',
      options: {
        livereload: true
      }
    }
  },
  connect: {
    server: {
      options: {
        port: 4000,
        host: 'localhost',
        livereload: true,
        open: true
      }
    }
  }
});

grunt.registerTask('build', ['markdown', 'copy']);
grunt.registerTask('default', ['build', 'connect:server', 'watch']);