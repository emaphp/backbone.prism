//
// Backbone.Prism - v1.2.0
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
    Prism.VERSION = '1.2.0';
    Prism.extend = Backbone.Model.extend;

    //
    // Helpers
    // -------

    // Merge a list of options by keys
    var mergeOptions = function(options, keys) {
        if (!options) {
            return;
        }

        _.extend(this, _.pick(options, keys));
    };

    // Obtains an option by name
    var getOption = function(target, optionName) {
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
    var proxyGetOption = function(optionName) {
        return getOption(this, optionName);
    };

    // Removes all event related data from an instance
    var destroy = function() {
        this.trigger('destroy');
        this.stopListening();
        this.off();
        return this;
    };

    //
    // Prism.Object (based on Marionette.Object)
    // -----------------------------------------
    // The Prism.Object is a simple extendable class including Backbone.Events as a mixin.

    Prism.Object = function(options) {
        this.options = _.extend({}, _.result(this, 'options'), options);
        this.initialize.apply(this, arguments);
    };

    Prism.Object.extend = Prism.extend;

    _.extend(Prism.Object.prototype, Backbone.Events, {
        initialize: function() {},
        mergeOptions: mergeOptions,
        getOption: proxyGetOption,
        destroy: destroy
    });

    //
    // Prism.Channel
    // -------------
    // The Prism.Channel class implements a full messaging API (courtesy of Backbone.Radio).

    Prism.Channel = Prism.Object.extend(_.extend({
        destroy: function() {
            this.off();
            this.stopListening();
            this.stopReplying();
            return this;
        }
    }, Backbone.Radio.Requests));

    //
    // Prism.Events
    // ------------
    // The Prism.Events mixin provides the same messaging interface implemented in Prism.Channel.

    Prism.Events = _.extend({}, Backbone.Events, Backbone.Radio.Requests);

    //
    // Prism.Dispatcher
    // ----------------
    // The Prism.Dispatcher class extends Flux.Dispatcher adding the handleViewAction and handleServerAction methods.

    Prism.Dispatcher = function() {
        Flux.Dispatcher.prototype.constructor.apply(this, arguments);
    };

    Prism.Dispatcher.prototype = new Flux.Dispatcher();

    _.extend(Prism.Dispatcher.prototype, {
        handleViewAction: function(action) {
            return this.dispatch({
                source: 'view',
                action: action
            });
        },

        handleServerAction: function(action) {
            return this.dispatch({
                source: 'server',
                action: action
            });
        }
    });

    //
    // Prism.ViewMutator
    // -----------------
    // A Prism.ViewMutator instance applies changes to a view configuration object.

    var ViewMutator = Prism.Object.extend({
        // Initializes a ViewMutator instance
        // Expects a parent view, the corresponding component and an additional callback
        initialize: function(parent, context, callback) {
            this.parent = parent;
            this.context = context;
            this.callback = callback;

            // On start, apply changes to view but don't trigger an event
            parent.on('wakeup', (function() {
                this.apply(true);
            }).bind(this));
        },

        // Applies modifications to a view instance
        apply: function(silent) {
            _.extend(this.parent.options, this.callback.call(this.context));
            if (silent === true) return;
            this.trigger('apply', silent);
        },

        //Updates a component state and applies the mutator
        update: function(state, silent) {
            _.extend(this.context.state, state);
            this.apply(silent);
        }
    });

    Prism.ViewMutator = ViewMutator;

    //
    // Prism.ViewComparator
    // --------------------
    // The Prism.ViewComparator class determines the order to apply to a list of models.

    var ViewComparator = ViewMutator.extend({
        apply: function(silent) {
            _.extend(this.parent.options, {
                comparator: this.callback.call(this.context)
            });
            if (silent === true) return;
            this.trigger('apply');
        },
    });

    Prism.ViewComparator = ViewComparator;

    //
    // Prism.ViewFilter
    // ----------------
    // The Prism.ViewFilter class determines which models are removed from a view.

    var ViewFilter = ViewMutator.extend({
        apply: function(silent) {
            this.parent.options.filters = this.parent.options.filters || {};
            this.parent.options.filters[this.cid] = this.callback.call(this.context);
            if (silent === true) return;
            this.trigger('apply');
        }
    });

    Prism.ViewFilter = ViewFilter;

    //
    // BaseMixin
    // ---------
    // BaseMixin implements common logic used by Prism.State and Prism.Store classes.

    var BaseMixin = {
        _isInitialized: false,

        // Initializes children views
        start: function() {
            this.trigger('start');
            this._isInitialized = true;
        }
    };

    //
    // ViewBaseMixin
    // -------------
    // ViewBaseMixin implements common logic used by Prism.StateView and Prism.StoreView classes.

    var ViewBaseMixin = _.extend({
        mutators: {},

        // Determines is the view is initialized
        isInitialized: function() {
            return !!this._isInitialized;
        },

        // Returns a new ViewMutator instance
        createMutator: function(callback, context) {
            var mutator = new ViewMutator(this, context, callback);
            mutator.cid = _.uniqueId('mutator');
            this._storeMutator(mutator);
            return mutator;
        },

        // Stores a ViewMutator instance
        _storeMutator: function(mutator) {
            // Apply mutators when something changes
            this.listenTo(mutator, 'apply', function(silent) {
                if (!silent) this.sync();
            });

            // Stop listening when destroyed
            this.listenTo(mutator, 'destroy', function() {
                this.stopListening(mutator);
                delete this.mutators[mutator.cid];
                this.sync();
            });

            this.mutators[mutator.cid] = mutator;
        },

        // Determines if the view is active
        isActive: function() {
            return !!this._isActive;
        },

        // Deactivates store event listener
        sleep: function() {
            this.stopListening(this.parent, this.options.listenTo);
            this._isActive = false;
        },

        // Activates store event listener
        wakeup: function(sync) {
            this.listenTo(this.parent, this.options.listenTo, this.sync);
            this._isActive = true;
            if (sync === false) return;
            this.sync();
        }
    }, Backbone.Events);

    //
    // ViewableMixin
    // -------------
    // Mixin for 'viewable' objects.

    var ViewableMixin = {
        views: {},

        // Obtains a view by its name
        getView: function(name) {
            return this.views[name];
        },

        // Returns a default StateView instance for this state
        getDefaultView: function(options) {
            if (this.views.default) {
                return this.views.default;
            }

            return this.createView(_.extend(options || {}, {
                name: 'default'
            }));
        }
    };

    //
    // ViewableStateMixin
    // ------------------
    // Mixin for 'viewable' state objects (State and StateView).

    var ViewableStateMixin = {
        createView: function(options) {
            options = options || {};
            var view = new StateView(this, options);
            view.name = options.name ? options.name : _.uniqueId('view');
            this.views[view.name] = view;

            // Remove view when destroyed
            this.listenTo(view, 'destroy', function() {
                delete this.views[view.name];
            });

            return view;
        }
    };

    _.extend(ViewableStateMixin, ViewableMixin);

    //
    // ViewableStoreMixin
    // ------------------
    // Mixin for 'viewable' store objects (Store and StoreView).

    var ViewableStoreMixin = {
        // Generates a new StoreView instance
        createView: function(options) {
            options = options || {};
            // Create view instance
            var view = new StoreView(this, options);
            view.name = options.name ? options.name : _.uniqueId('view');
            this.views[view.name] = view;

            // Remove view when destroyed
            this.listenTo(view, 'destroy', function() {
                delete this.views[view.name];
            });

            return view;
        },
    };

    _.extend(ViewableStoreMixin, ViewableMixin);

    //
    // Prism.StateView
    // ---------------
    // A Prism.StateView instance keeps track of a Prism.State object.

    var StateView = Prism.StateView = function(parent, options) {
        this.parent = parent;
        this.options = _.extend({}, _.result(this, 'options'), options);
        this.options.listenTo = this.options.listenTo || 'change';
        this._isInitialized = false;
        this._isActive = false;

        this.listenTo(parent, 'start', function() {
            // Initialize mutators
            this.trigger('wakeup');

            // Listen for changes
            this.wakeup(false);
            this._isInitialized = true;
            this.sync();

            //Initialize subviews
            this.trigger('start');
        });

        this.initialize.apply(this, arguments);
    };

    // Include additional mixins
    _.extend(StateView.prototype, ViewBaseMixin, ViewableStateMixin, {
        initialize: function() {},

        sync: function() {
            if (!this._isActive) return;
            this.attributes = this.parent.cid ? _.extend({
                cid: this.parent.cid
            }, this.parent.attributes) : _.extend({}, this.parent.attributes);
            this.trigger('sync');
        },

        toJSON: function() {
            return _.extend({
                cid: this.parent.cid
            }, this.attributes);
        },

        destroy: destroy
    });

    StateView.extend = Backbone.Model.extend;

    //
    // Prism.State
    // -----------
    // The Prism.State class is a Backbone.Model subclass adding 'viewable' behavior.

    Prism.StateMixin = _.extend({
        constructor: function(attributes, options) {
            var attrs = attributes || {};
            options = options || {};
            this.cid = _.uniqueId('c');
            this.attributes = {};
            this.views = {};
            if (options.collection) this.collection = options.collection;
            if (options.parse) attrs = this.parse(attrs, options) || {};
            attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
            this.set(attrs, options);
            this.changed = {};
            this.initialize.apply(this, arguments);
        }
    }, BaseMixin, ViewableStateMixin);

    // Build State class
    Prism.State = Backbone.Model.extend(Prism.StateMixin);

    //
    // Prism.StoreView
    // ---------------
    // A Prism.StoreView instance keeps track of a Prism.Store object.

    var StoreView = Prism.StoreView = function(parent, options) {
        this.parent = parent;
        this.models = [];
        this.length = 0;
        this._isInitialized = false;
        this.options = _.extend({}, _.result(this, 'options'), options);
        this.options.listenTo = this.options.listenTo || 'add remove change reset';

        // Initialize with parent store
        this.listenTo(parent, 'start', function() {
            // Initialize mutators
            this.trigger('wakeup');

            // Synchronize models
            this.wakeup(false);
            this._isInitialized = true;
            this.sync();

            //Initialize sub-views
            this.trigger('start');
        });

        // Initialize instance
        this.initialize.apply(this, arguments);
    };

    // Include additional mixins
    _.extend(StoreView.prototype, ViewBaseMixin, ViewableStoreMixin, {
        initialize: function() {},

        // Synchronizes models against the store
        sync: function() {
            if (!this._isActive) return;
            this.models = _.clone(this.parent.models);

            // Apply default filter
            if (this.options.filter) {
                if (_.isFunction(this.options.filter)) {
                    this.models = this.filter(this.options.filter);
                } else if (_.isObject(this.options.filter)) {
                    var matches = _.matches(this.options.filter);
                    this.models = this.filter(function(model) {
                        return matches(model.attributes);
                    });
                }
            }

            // Apply additional filters
            if (this.options.filters) {
                _.each(this.options.filters, (function(filter) {
                    if (_.isFunction(filter)) {
                        this.models = this.filter(filter);
                    } else if (_.isObject()) {
                        var matches = _.matches(filter);
                        this.models = this.filter(function(model) {
                            return matches(model.attributes);
                        });
                    }
                }).bind(this));
            }

            // Sort models
            if (this.options.comparator) {
                if (_.isString(this.options.comparator) || this.options.comparator.length === 1) {
                    this.models = this.sortBy(this.options.comparator, this);
                } else {
                    this.models.sort(_.bind(this.options.comparator, this));
                }
            }

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
            this.length = this.models.length;

            // Update associated components
            this.trigger('sync');
        },

        // Returns a JSON representation of a store
        toJSON: function() {
            return this.models.map(function(model) {
                return _.extend({
                    cid: model.cid
                }, model.toJSON());
            });
        },

        // Return a new ViewFilter instance
        createFilter: function(callback, context) {
            var filter = new ViewFilter(this, context, callback);
            filter.cid = _.uniqueId('filter');
            this._storeMutator(filter);
            return filter;
        },

        // Returns a new ViewComparator instance
        createComparator: function(callback, context) {
            var comparator = new ViewComparator(this, context, callback);
            comparator.cid = _.uniqueId('comparator');
            this._storeMutator(comparator);
            return comparator;
        },

        destroy: destroy
    });

    // Add additional Underscore.js methods
    var _methods = ['forEach', 'each', 'map', 'collect', 'reduce',
        'foldl', 'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter',
        'select', 'reject', 'every', 'all', 'some', 'any', 'include', 'includes',
        'contains', 'invoke', 'max', 'min', 'toArray', 'size', 'first',
        'head', 'take', 'initial', 'rest', 'tail', 'drop', 'last',
        'without', 'difference', 'indexOf', 'shuffle', 'lastIndexOf',
        'isEmpty', 'chain', 'sample', 'partition'
    ];

    _.each(_methods, function(method) {
        StoreView.prototype[method] = function() {
            var args = [].slice.call(arguments);
            args.unshift(this.models);
            return _[method].apply(_, args);
        };
    });

    _.each(['groupBy', 'countBy', 'sortBy', 'indexBy'], function(method) {
        StoreView.prototype[method] = function(value, context) {
            var iterator = _.isFunction(value) ? value : function(model) {
                return model.get(value);
            };
            return _[method](this.models, iterator, context);
        };
    });

    StoreView.extend = Backbone.Model.extend;

    //
    // Prism.Store
    // -----------
    // The Prism.Store class is a Backbone.Collection subclass adding 'viewable' behavior.

    Prism.StoreMixin = _.extend({
        constructor: function(models, options) {
            options = options || {};
            if (options.model) this.model = options.model;
            if (options.comparator !== void 0) this.comparator = options.comparator;
            this._reset();
            this.views = {};
            this.initialize.apply(this, arguments);
            if (models) this.reset(models, _.extend({
                silent: true
            }, options));
        }
    }, BaseMixin, ViewableStoreMixin);

    // Build Store class
    Prism.Store = Backbone.Collection.extend(Prism.StoreMixin);

    //
    // Prism.compose
    // -------------
    // Returns a Higher-Order Component that wraps the given class.

    //This function implements the default behaviour for 'sync' events triggered on views
    var defaultOnSync = function(component, view, cclass) {
        if (_.isFunction(cclass.prototype.transform)) {
            component.setState(cclass.prototype.transform.call(component, view));
        } else {
            component.setState({
                view: view.toJSON()
            });
        }
    };

    Prism.compose = function(React, Component, onSync) {
        var wrapper = React.createClass({
            componentWillMount: function() {
                // Update state when view changes
                this.listenTo(this.props.view, 'sync', function() {
                    if (_.isFunction(onSync)) {
                        onSync(this, this.props.view, Component, arguments);
                    } else {
                        defaultOnSync(this, this.props.view, Component);
                    }
                });
            },

            componentWillUnmount: function() {
                //Stop listening for events
                this.stopListening(this.props.view, 'sync');
            },

            render: function() {
                var self = this;
                var props = {
                    values: function(key) {
                        if (key !== undefined) {
                            return self.state[key];
                        }

                        return self.state ? self.state : {};
                    }
                };

                //Render wrapper component
                return React.createElement(Component, _.extend(props, this.props));
            }
        });

        _.extend(wrapper.prototype, Prism.Events);
        return wrapper;
    };

    return Prism;
}));
