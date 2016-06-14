module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            files: ['Gruntfile.js', 'dist/<%= pkg.name %>.js', 'test/*.js'],

            options: {
                globals: {
                    'Backbone': true,
                    _: true,
                    'Backbone.Radio': true,
                    'Flux': true,
                    'React': true
                }
            }
        },

        uglify: {
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('release', ['jshint', 'uglify:dist']);
};
