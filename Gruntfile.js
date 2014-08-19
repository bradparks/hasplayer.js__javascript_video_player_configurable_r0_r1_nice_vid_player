module.exports = function(grunt) {
  grunt.initConfig({

    path: 'build',

    //Check for syntax errors
    jshint: {
      all: ["app/js/*/**/*.js"],
      options: {
        jshintrc: ".jshintrc"
      }
    },

    //Copy the index to the build folder
    copy: {
      html: {
        src: 'index.html', dest: '<%= path %>/index.html'
      }
    },

    //Configuration for blocks in HTML
    useminPrepare: {
      html: 'index.html',
      options: {
        dest: '<%= path %>'
      }
    },

    //The HTML to parse
    usemin: {
      html: ['<%= path %>/index.html']
    },

    //Get CSS files into one and replace all file url with base64 inline
    cssUrlEmbed: {
      encodeDirectly: {
        files: {
          '<%= path %>/style.css': [
          'app/lib/bootstrap/css/bootstrap.min.css',
          'app/lib/bootstrap/css/bootstrap-glyphicons.css',
          'app/lib/angular.treeview/css/angular.treeview.css',
          'app/css/main.css',
          'app/lib/video/video-4.6.min.css',
          'app/lib/jquery.ui/jquery-ui-1.10.3.custom.min.css',
          'app/lib/jquery.ui.labeledSlider/jquery.ui.labeledslider.css'
          ]
        },
        options: {
          failOnMissingUrl: false
        }
      }
    },

    //Options for minify CSS
    cssmin: {
      generated: {
        options: {
          keepSpecialComments: 0
        }
      },
      style: {
        options: {
          keepSpecialComments: 0
        },
        files: {
          '<%= path %>/style.css': ['<%= path %>/style.css']
        }
      }
    },

    //Write CSS from style.css inline in HTML where block is main
    htmlbuild: {
      dist: {
        src: '<%= path %>/index.html',
        dest: '<%= path %>',
        options: {
          beautify: false,
          relative: true,
          styles: {
            main: ['<%= path %>/style.css']
          }
        }
      }
    },

    //Options for minify JavaScript
    uglify: {
      generated: {
        options: {
          compress:{
            pure_funcs: [
            'self.debug.log',
            'this.debug.log',
            'rslt.debug.log'
            ],
            global_defs: {
              DEBUG: true
            },
            drop_console : true,
            drop_debugger: true,
            warnings: true
          },
          banner: '/* Last build : @@TIMESTAMPTOREPLACE / git revision : @@REVISIONTOREPLACE */\n'
        }
      },
      json: {
        options: {
          beautify : false,
          mangle: false
        },
        files: {
          '<%= path %>/json.js': ['<%= path %>/json.js']
        }
      } 
    },

    //Transform the json files in objects all in one JavaScript file
    json: {
      main: {
        options: {
          namespace: 'jsonData',
          includePath: false,
          processName: function(filename) {
            return filename.toLowerCase();
          }
        },
        src: ['app/sources.json', 'app/notes.json', 'app/contributors.json', 'app/player_libraries.json', 'app/showcase_libraries.json'],
        dest: '<%= path %>/json.js'
      }
    },

    //Merge the JavaScript Json file with the index.js one
    concat: {
      jsonToIndex: {
        src: ['<%= path %>/index.js', '<%= path %>/json.js'],
        dest: '<%= path %>/index.js',
      },
    },

    //Minify the HTML
    htmlmin: {
      main: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          '<%= path %>/index.html': '<%= path %>/index.html'
        }
      }
    },

    //Get the revision info from git
    revision: {
      options: {
        property: 'meta.revision',
        ref: 'development',
        short: true
      }
    },

    //Put the revision info in JS files
    replace: {
      all: {
        options: {
          patterns: [
          {
            match: 'REVISIONTOREPLACE',
            replacement: '<%= meta.revision %>'
          },
          {
            match: 'TIMESTAMPTOREPLACE',
            replacement: '<%= (new Date().getDate())+"."+(new Date().getMonth()+1)+"."+(new Date().getFullYear())+"_"+(new Date().getHours())+":"+(new Date().getMinutes())+":"+(new Date().getSeconds()) %>'
          }
          ]
        },
        files: [
        {expand: true, flatten: true, src: ['<%= path %>/player.js', '<%= path %>/index.js'], dest: '<%= path %>'}
        ]
      }
    },

    //Remove folder at start and temporary files in the end
    clean: {
      start: {
        src: ['<%= path %>']
      },
      end: {
        src: ['<%= path %>/style.css', '<%= path %>/json.js']
      }
    }

  });

  // Require needed grunt-modules
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-git-revision');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-css-url-embed');
  grunt.loadNpmTasks('grunt-json');
  grunt.loadNpmTasks('grunt-html-build');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-replace');


  grunt.registerTask('test', [
    'jshint'
    ]);

  grunt.registerTask('build', [
    'clean:start',        //empty folder
    'copy',               //copy HTML file
    'revision',           //get git info
    'useminPrepare',      //get files in blocks tags
    'concat:generated',   //merge all the files in one for each blocks
    'cssUrlEmbed',        //get the CSS files and merge into one
    'cssmin:style',       //minify the generated CSS file
    'cssmin:generated',   //minify the CSS in blocks (none)
    'uglify:generated',   //minify the JS in blocks
    'json',               //get the json files into a json.js
    'uglify:json',        //minify the json.js file
    'concat:jsonToIndex', //merge the json.js file with index.js
    'usemin',             //replace the tags blocks by the result
    'htmlbuild',          //inline the CSS
    'htmlmin:main',       //Minify the HTML
    'replace',            //Add the git info in files
    'clean:end'           //Clean temp files
    ]);
};
