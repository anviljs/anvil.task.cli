var taskFactory = function( _, anvil ) {

    anvil.plugin( {
        name: "anvil.build-task-runner",
        activities: [ "pre-build", "post-build" ],
        testsPassed: true,

        configure: function( config, command, done ) {
            var self = this;
            anvil.on( "tests.failed", function() {
                self.testsPassed = false;
            } );

            anvil.on( "tests.passed", function() {
                self.testsPassed = true;
            } );

            done();
        },

        getTask: function( taskName ) {
            return anvil.extensions.tasks[ taskName ];
        },

        "post-build": function( done ) {
            var postBuildTasks = anvil.config.postBuild;
            if( this.testsPassed && !_.isEmpty( postBuildTasks ) ) {
                this.runTasks( postBuildTasks, done );
            } else {
                done();
            }
        },

        "pre-build": function( done ) {
            var preBuildTasks = anvil.config.preBuild;
            if( !_.isEmpty( preBuildTasks ) ) {
                this.runTasks( preBuildTasks, done );
            } else {
                done();
            }
        },

        run: function( done, activity ) {
            this[ activity ]( done );
        },

        runTasks: function( list, done ) {
            var tasks = _.map( list, function( options, taskName ) {
                return function( done ) {
                    var task = anvil.extensions.tasks[ taskName ];
                    if( task ) {
                        task.run( options, done );
                    } else {
                        done();
                    }
                };
            } );
            anvil.scheduler.pipeline( undefined, tasks, done );
        }
    } );

    anvil.command( {
        name: "anvil.task",
        commander: {
            "tasks": {
                action: "list",
                description: "list out tasks"
            },
            "*": {
                action: "run",
                description: "run task"
            }
        },

        getTask: function( taskName ) {
             return anvil.extensions.tasks[ taskName ];
        },

        run: function( taskName, options, done ) {
            var task = this.getTask( taskName );
            if( !task ) {
                anvil.log.error( "The task '" + taskName + "' could not be found. Please run 'anvil tasks' to see a list of available tasks." );
            } else {
                task.run( options, done );
            }
        },

        
        list: function( options, done ) {
            console.log( "Installed tasks:" );
            var limit = 30,
                padding = new Array( limit ).join( " " );
            _.each( anvil.extensions.tasks, function( task ) {
                var name = ( task.name + padding ).substr( 0, limit ),
                    description = task.description || "No description provided";
                console.log( "  " + name + description );
            } );
            done();
        }
    } );
};

module.exports = taskFactory;