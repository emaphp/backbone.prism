//
// Backbone.Prism - v1.0.0
// ------------------------
// Flux-like architecture for Backbone.js
// Copyright 2015 Emmanuel Antico
// This library is distributed under the terms of the MIT license.
//
(function(global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['backbone', 'underscore', 'flux', 'backbone.radio'], function(Backbone, _, Flux) {
            return factory(global, Backbone, _, Flux);
        });
    } else if (typeof exports !== 'undefined') {
        var Radio = require('backbone.radio');
        module.exports = factory(global, require('backbone'), require('underscore'), require('flux'));
    } else {
        factory(global, global.Backbone, global._, global.Flux);
    }
}(this, function(global, Backbone, _, Flux) {
    var Prism = Backbone.Prism = Backbone.Prism || {};
    Prism.VERSION = '1.0.0';
    Prism.extend = Backbone.Model.extend;

    //
    // Helpers
    // -------
    
    // Merge a list of options by keys
    var mergeOptions = function (options, keys) {
        if (!options) {
            return;
        }

        _.extend(this, _.pick(options, keys));
    };

    // Obtains an option by name
    var getOption = function (target, optionName) {
        if (!target || !optionName) {
            return;
        }

        if (target.options && (target.options[optionName] !== undefined)) {
            return target.options[optionName];
        } else {
            return target[optionName];
        }
    };

    // Proxy method for obtaining an option value
    var proxyGetOption = function (optionName) {
        return getOption(this, optionName);
    };
    
    // Registers a list of actions in a dispatcher instance
    var register = function (dispatcher, actions) {
        dispatcher.register((function(payload) {
            var source = payload.source;
            var action = payload.action;
            var type = action.type;

            if (type.indexOf(':') !== -1) {
                if (typeof this.name !== 'undefined' && type.split(':')[0] !== this.name) {
                    return;
                }

                type = type.split(':')[1];
            }

            var data = action.data;
            var options = action.options ? action.options : {};

            if (_.isFunction(actions[type])) {
                actions[type].call(this, data, options, source);
            }
        }).bind(this));
    };
    
    // Removes all event related data from an instance
    var destroy = function () {
        this.trigger('destroy');
        this.stopListening();
        this.off();
        return this;
    };

    //
    // Prism.Object (based on Marionette.Object)
    // -----------------------------------------
    // The Prism.Object is a simple extendable class including Backbone.Events as a mixin.
    
    Prism.Object = function (options) {
        this.options = _.extend({}, _.result(this, 'options'), options);
        this.initialize.apply(this, arguments);
    };

    Prism.Object.extend = Prism.extend;

    _.extend(Prism.Object.prototype, Backbone.Events, {
        initialize: function () {},

        mergeOptions: mergeOptions,

        getOption: proxyGetOption,
        
        destroy: destroy
    });
    
    //
    // Prism.Dispatcher
    // ----------------
    // The Prism.Dispatcher class extends Flux.Dispatcher adding the handleViewAction and
    // handleServerAction methods.

    Prism.Dispatcher = function () {
        Flux.Dispatcher.prototype.constructor.apply(this, arguments);
    };

    Prism.Dispatcher.prototype = new Flux.Dispatcher();

    _.extend(Prism.Dispatcher.prototype, {
        handleViewAction: function (action) {
            this.dispatch({
                source: 'view',
                action: action
            });
        },

        handleServerAction: function (action) {
            this.dispatch({
                source: 'server',
                action: action
            });
        }
    });

    //
    // Prism.ViewMutator
    // -----------------
    // A Prism.ViewMutator instance applies changes to a view options object.
    
    var ViewMutator =  Prism.Object.extend({
        // Initializes a ViewMutator instance
        // Expects a parent view, the corresponding component and an additional callback
        initialize: function (parent, context, callback) {
            this.parent = parent;
            this.context = context;
            this.callback = callback;
            
            // On start, apply changes to view but don't trigger an event
            parent.on('start', this.update(null, true));
        },
        
        // Applies modifications to a view instance
        // If required, an additional state argument can be supplied
        apply: function (state) {
            if (state) _.extend(this.context.state, state); // Merge state
            _.extend(this.parent.options, this.callback.call(this.context));
        },
        
        // Returns a function that applies a set of changes to a view
        update: function (state, silent) {
            return (function () {
                this.apply(state);
                if (silent === true) return; // If silent, don't trigger any event
                this.trigger('apply', state);
            }).bind(this);
        }
    });
    
    Prism.ViewMutator = ViewMutator;
    
    //
    // Prism.ViewComparator
    // --------------------
    // The Prism.ViewComparator class extends Prism.ViewMutator, only modifying the
    // view comparator.
    
    var ViewComparator = ViewMutator.extend({
        apply: function () {
            _.extend(this.parent.options, {comparator: this.callback.call(this.context)});
        },
    });
    
    Prism.ViewComparator = ViewComparator;
    
    //
    // Prism.ViewFilter
    // ----------------
    // The Prism.ViewFilter class extends Prism.ViewMutator, only modifying the
    // associated filter.
    
    var ViewFilter = ViewMutator.extend({
        apply: function () {
            this.parent.options.filters = this.parent.options.filters || {};
            this.parent.options.filters[this.cid] = this.callback.call(this.context);
        }
    });
    
    Prism.ViewFilter = ViewFilter;
    
    //
    // Prism.MutatorMixin
    // ------------------
    // The Prism.MutatorMixin includes the methods and properties required by state and
    // store views.
    
    var MutatorMixin = {
        mutators: {},
        
        // Returns a new ViewMutator instance
        createMutator: function (callback, context) {
            var mutator = new ViewMutator(this, context, callback);
            mutator.cid = _.uniqueId('mutator');
            this._storeMutator(mutator);
            return mutator;
        },
        
        // Stores a ViewMutator instance
        _storeMutator: function (mutator) {
            // Apply mutators when something changes
            this.listenTo(mutator, 'apply', function (state) {
                this.sync(state);
            });
            
            // Stop listening when destroyed
            this.listenTo(mutator, 'destroy', function () {
                this.stopListening(mutator);
                delete this.mutators[mutator.cid];
                this.sync();
            });
            
            this.mutators[mutator.cid] = mutator;
        }
    };
    
    Prism.MutatorMixin = MutatorMixin;
    
    //
    // Prism.StateView
    // ---------------
    // A Prism.StateView instance keeps track of a Prism.State object.
    
    function StateView (state, options) {
        this.state = state;
        this.options = _.extend({}, _.result(this, 'options'), options);
        this._isInitialized = false;
        
        this.listenTo(state, 'start', function () {
            // Initialize mutators
            this.trigger('start');
            
            // Listen for changes
            this.listenTo(state, this.options.listenTo ? this.options.listenTo : 'change', this.sync);
            
            // Synchronize against state
            this.sync();
            this._isInitialized = true;
        });
        
        this.initialize.apply(this, arguments);
    }
    
    // Include additional mixins
    _.extend(StateView.prototype, Backbone.Events, Backbone.Radio.Commands, Backbone.Radio.Requests, MutatorMixin, {
        sync: function (state) {
            this.attrs = _.extend({cid: this.state.cid}, this.state.attributes);
            this.trigger('sync', state);
        },
        
        toJSON: function () {
            return _.extend({cid: this.state.cid}, this.attrs);
        },
        
        destroy: destroy
    });
    
    Prism.StateView = StateView;
    
    //
    // Prism.State
    // -----------
    // The Prism.State class is a Backbone.Model subclass adding 'viewable' behavior.
    
    var BaseMixin = {
        views: {},
        
        _isInitialized: false,
        
        // Initializes children views
        start: function () {
            this.trigger('start');
            this._isInitialized = true;
        },
        
        // Obtains a view by its name
        getView: function (name) {
            return this.views[name];
        },
        
        // Registers a list of methods in a dispatcher instance
        register: register,
    };
    
    Prism.StateMixin = _.extend({
        // Returns a new StateView instance
        createView: function (options) {
            var view = new StateView(this, options);
            view.name = options.name ? options.name : _.uniqueId('view');
            this.views[view.name] = view;
            return view;
        },
        
        // Returns a default StateView instance for this state
        getDefaultView: function () {
            if (this.views.default) {
                return this.views.default;
            }
            
            var view = new StateView(this, {});
            view.name = 'default';
            this.views.default = view;
            return view;
        }
    }, BaseMixin);
    
    // Build State class
    Prism.State = Backbone.Model.extend(Prism.StateMixin);
        
    //
    // Prism.StoreView
    // ---------------
    // A Prism.StoreView instance keeps track of a Prism.Store object.

    function StoreView (store, options) {
        this.store = store;
        this.models = [];
        this.length = 0;
        this._isInitialized = false;
        this.options = _.extend({}, _.result(this, 'options'), options);
        
        // Initialize with parent store
        this.listenTo(store, 'start', function () {
            // Initialize mutators
            this.trigger('start');
            
            // Listen for changes
            this.listenTo(store, this.options.listenTo ? this.options.listenTo : 'add change remove', this.sync);

            // Synchronize models
            this.sync();
            this._isInitialized = true;
        });
        
        // Initialize instance
        this.initialize.apply(this, arguments);
    }

    // Include additional mixins
    _.extend(StoreView.prototype, Backbone.Events, Backbone.Radio.Commands, Backbone.Radio.Requests, MutatorMixin, {
        initialize: function () {},
        
        // Synchronizes models against the store
        sync: function (state) {
            this.models = _.clone(this.store.models);
            
            // Apply default filter
            if (this.options.filter) {
                if (_.isFunction(this.options.filter)) {
                    this.models = this.filter(this.options.filter);
                } else if (_.isObject(this.options.filter)) {
                    var matches = _.matches(this.options.filter);
                    this.models = this.filter(function (model) {
                        return matches(model.attributes);
                    });
                }
            }
            
            // Apply additional filters
            if (this.options.filters) {
                _.each(this.options.filters, (function (filter) {
                    this.models = this.filter(filter);
                }).bind(this));
            }
            
            // Sort models
            if (this.options.comparator) {
                this.models.sort(_.bind(this.options.comparator, this));
            }

            // Update length
            this.length = this.models.length;
            
            // Set bounds
            if (this.options.size || typeof this.options.offset !== 'undefined') {
                var length = this.models.length;
                var size = this.options.size || length;
                var offset = typeof this.options.offset == 'undefined' ? 0 : Math.abs(this.options.offset);

                if (size > 0) {
                    this.models = this.models.slice(offset, offset + size);
                } else if (size < 0) {
                    var index = Math.abs(length + size - offset);
                    this.models = this.models.slice(index, length - offset);
                }
            }
            
            // Update length
            this.size = this.models.length;
            
            // Update associated components
            this.trigger('sync', state);
        },

        // Returns a JSON representation of a store
        toJSON: function () {
            return this.models.map(function (model) {
                return _.extend({cid: model.cid}, model.toJSON());
            });
        },
        
        // Return a new ViewFilter instance
        createFilter: function (callback, context) {
            var filter = new ViewFilter(this, context, callback);
            filter.cid = _.uniqueId('filter');
            this._storeMutator(filter);
            return filter;
        },
        
        // Returns a new ViewComparator instance
        createComparator: function (callback, context) {
            var comparator = new ViewComparator(this, context, callback);
            comparator.cid = _.uniqueId('comparator');
            this._storeMutator(comparator);
            return comparator;
        },
        
        destroy: destroy
    });

    // Add additional Underscore.js methods
    var _methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
        'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
        'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
        'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
        'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
        'lastIndexOf', 'isEmpty', 'chain', 'sample'];

    _.each(_methods, function(method) {
        StoreView.prototype[method] = function () {
            var args = [].slice.call(arguments);
            args.unshift(this.models);
            return _[method].apply(_, args);
        };
    });

    _.each(['groupBy', 'countBy', 'sortBy', 'indexBy'], function(method) {
        StoreView.prototype[method] = function (value, context) {
            var iterator = _.isFunction(value) ? value : function (model) {
                return model.get(value);
            };
            return _[method](this.models, iterator, context);
        };
    });

    Prism.StoreView = StoreView;

    //
    // Prism.Store
    // -----------
    // The Prism.Store class is a Backbone.Collection subclass adding 'viewable' behavior.

    Prism.StoreMixin = _.extend({
        // Generates a new StoreView instance
        createView: function(options) {
            // Create view instance
            var view = new StoreView(this, options);
            view.name = options.name ? options.name : _.uniqueId('view');
            this.views[view.name] = view;
            
            // Remove view when destroyed
            this.listenTo(view, 'destroy', function () {
                delete this.views[view.name];
            });
            
            return view;
        },
        
        // Returns a default store view for this instance
        getDefaultView: function () {
            if (this.views.default) {
                return this.views.default;
            }
            
            var view = new StoreView(this, {});
            view.name = 'default';
            this.views.default = view;
            
            this.listenTo(view, 'destroy', function () {
                delete this.views.default;
            });
            
            return view;
        }
    }, BaseMixin);
    
    // Build Store class
    Prism.Store = Backbone.Collection.extend(Prism.StoreMixin);
    
    //
    // Prism.ViewMixin
    // ---------------
    // The Prism.ViewMixin includes additional methods for listening sync events
    // triggered by a state/store view. It also supports state transformations.
    
    Prism.ViewMixin = _.extend({
        getInitialState: function () {
            if (_.isFunction(this.transform)) {
                return this.transform(this.props.view);
            }
            
            return {
                view: this.props.view.toJSON()
            };
        },
        
        componentDidMount: function () {
            this.listenTo(this.props.view, 'sync', function () {
                this.setState(_.isFunction(this.transform) ? this.transform(this.props.view) : {
                    view: this.props.view.toJSON()
                });
            });
        },
        
        componentWillUnmount: function () {
            this.stopListening(this.props.view, 'sync');
        }
    }, Backbone.Events);

    return Prism;
}));