/*
	anvil.task.cli - An anvil core extension that exposes tasks to the command line
	version:	0.1.0
	author:		Alex Robson <alex@sharplearningcurve.com> (http://sharplearningcurve.com)
	copyright:  2011 - 2012
	license:	Dual licensed
				MIT (http://www.opensource.org/licenses/mit-license)
				GPL (http://www.opensource.org/licenses/gpl-license)
*/
var taskFactory = function( _, anvil ) {
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

        getList: function( taskName, list, missing ) {
            var self = this;
            if( list[ taskName ] ) {
                return;
            } else {
                var task = this.getTask( taskName );
                if( task ) {
                    if( task.dependencies.length ) {
                        _.each( task.dependencies, function( dependency ) {
                            self.getList( dependency, list, missing );
                        } );
                    }
                    list[ taskName ] = task;
                } else {
                    missing.push( taskName );
                }
            }
        },

        run: function( taskName, options, done ) {
            var tasks = {},
                missing = [];
            this.getList( taskName, tasks, missing );
            if( missing.length ) {
                anvil.log.error( "The following tasks could not be found: " );
                    _.each( missing, function( dependency ) {
                        anvil.log.error( "   " + dependency );
                    } );
            } else {
                var sorted = anvil.utility.dependencySort( tasks, "ascending", function( a, b ) {
                    return a.name === b.name;
                } );
                var calls = _.pluck( tasks, "run" );
                anvil.scheduler.pipeline( undefined, calls, done );
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