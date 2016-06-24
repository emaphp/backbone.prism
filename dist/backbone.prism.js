//
// Backbone.Prism - v1.3.1
// ------------------------
// Flux-like architecture for Backbone.js
// Copyright 2015 - 2016 Emmanuel Antico
// This library is distributed under the terms of the MIT license.
//
(function (global, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['backbone', 'underscore', 'react', 'flux', 'backbone.radio'], function (Backbone, _, React, Flux) {
            return factory(global, Backbone, _, React, Flux);
        });
    } else if (typeof exports !== 'undefined') {
        var Radio = require('backbone.radio');
        module.exports = factory(global, require('backbone'), require('underscore'), require('react'), require('flux'));
    } else {
        factory(global, global.Backbone, global._, global.React, global.Flux);
    }
}(this, function (global, Backbone, _, React, Flux) {
    'use strict';
    var Prism = Backbone.Prism = Backbone.Prism || {};
    Prism.VERSION = '1.3.1';
    Prism.extend = Backbone.Model.extend;

    //
    // Helpers
    // -------
    // Utility helpers for general use classes (based on Marionette.js helpers).

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

    // Removes all event related data from an instance
    var destroy = function (options) {
        options = options || {};
        this.trigger('before:destroy', options);
        this.trigger('destroy', options);
        this.stopListening();
        return this;
    };

    //
    // Underscore Helpers
    // ------------------
    // Allows the injection of Underscore.js methods in classes.

    var modelMatcher = function (attrs) {
        var matcher = _.matches(attrs);
        return function (model) {
            return matcher(model.attributes);
        };
    };

    var cb = function (iteratee, instance) {
        if (_.isFunction(iteratee)) {
            return iteratee;
        }
        if (_.isObject(iteratee) && !instance._isModel(iteratee)) {
            return modelMatcher(iteratee);
        }
        if (_.isString(iteratee)) {
            return function (model) {
                return model.get(iteratee);
            };
        }
        return iteratee;
    };

    var addMethod = function (length, method, attribute) {
        switch (length) {
            case 1: return function () {
                return _[method](this[attribute]);
            };
            case 2: return function (value) {
                return _[method](this[attribute], value);
            };
            case 3: return function (iteratee, context) {
                return _[method](this[attribute], cb(iteratee, this), context);
            };
            case 4: return function (iteratee, defaultVal, context) {
                return _[method](this[attribute], cb(iteratee, this), defaultVal, context);
            };
            default: return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this[attribute]);
                return _[method].apply(_, args);
            };
        }
    };

    var addUnderscoreMethods = function (Class, methods, attribute) {
        _.each(methods, function (length, method) {
            if (_[method]) {
                Class.prototype[method] = addMethod(length, method, attribute);
            }
        });
    };

    //
    // Prism.Object (based on Marionette.Object)
    // -----------------------------------------
    // The Prism.Object is a simple extendable class including Backbone.Events as a mixin.

    Prism.Object = function (options) {
        this.options = _.extend({}, _.result(this, 'options'), options);
        this.initialize.apply(this, arguments);
    };

    _.extend(Prism.Object.prototype, Backbone.Events, {
        initialize: function () {},
        mergeOptions: mergeOptions,
        getOption: proxyGetOption,
        destroy: destroy
    });

    Prism.Object.extend = Prism.extend;

    //
    // Prism.Channel
    // -------------
    // The Prism.Channel class implements a full messaging API (courtesy of Backbone.Radio).

    Prism.ChannelMixin = _.extend({
        reset: function () {
            this.off();
            this.stopListening();
            this.stopReplying();
            return this;
        },

        destroy: function (options) {
            options = options || {};
            this.trigger('before:destroy', options);
            this.trigger('destroy', options);
            this.off();
            this.stopListening();
            this.stopReplying();
            return this;
        }
    }, Backbone.Radio.Requests);

    Prism.Channel = Prism.Object.extend(Prism.ChannelMixin);

    // Also wrap Backbone.Radio
    Prism.Radio = Backbone.Radio;

    //
    // Prism.Events
    // ------------
    // The Prism.Events mixin provides the same messaging interface implemented in Prism.Channel.

    Prism.Events = _.extend({}, Backbone.Events, Backbone.Radio.Requests);

    //
    // Prism.Dispatcher
    // ----------------
    // The Prism.Dispatcher class extends Flux.Dispatcher adding the handleViewAction and handleServerAction methods.

    Prism.Dispatcher = function () {
        Flux.Dispatcher.prototype.constructor.apply(this, arguments);
    };

    Prism.Dispatcher.prototype = new Flux.Dispatcher();

    _.extend(Prism.Dispatcher.prototype, {
        // Handles actions coming from the view
        handleViewAction: function (action) {
            return this.dispatch({
                source: 'view',
                action: action
            });
        },

        // Handles actions coming from the server
        handleServerAction: function (action) {
            return this.dispatch({
                source: 'server',
                action: action
            });
        }
    });

    //
    // Prism.ViewConfig
    // ----------------
    // A Prism.ViewConfig instance applies changes to a view configuration object.

    var ViewConfig = Prism.Object.extend({
        // Initializes a ViewConfig instance
        // Expects a parent view, the corresponding component and an additional callback
        initialize: function (view, component, callback) {
            this.view = view;
            this.component = component; // The component acts as the context of the given callback
            this.callback = callback;

            // On start, apply changes to view but don't trigger an event
            // This provides a 'silent' initialization which makes the view
            // get the desired behavior when the store/state is published
            this.listenTo(view, 'wakeup', this.eval(true));
        },

        // Applies modifications to a view configuration instance
        apply: function (silent) {
            _.extend(this.view.options, this.callback.call(this.component));
            if (!silent) {
                this.trigger('set', this);
            }
        },

        // Returns a binded function that applies the current config
        eval: function (silent) {
            return (function () {
                this.apply(silent);
            }).bind(this);
        },

        // Updates a component state without triggering a re-render
        // and then applies changes to the view configuration object
        // Used to avoid re-rendering on components that alter the view
        // that is being listened
        updateComponentState: function (state, silent) {
            _.extend(this.component.state, state);
            this.apply(silent);
        }
    });

    Prism.ViewConfig = ViewConfig;

    //
    // Prism.ViewComparator
    // --------------------
    // The Prism.ViewComparator class determines the order to apply to a list of models.

    var ViewComparator = ViewConfig.extend({
        // Sets the comparation callback for a view
        apply: function (silent) {
            _.extend(this.view.options, {
                comparator: this.callback.call(this.component)
            });
            if (!silent) {
                this.trigger('set', this);
            }
        },
    });

    Prism.ViewComparator = ViewComparator;

    //
    // Prism.ViewFilter
    // ----------------
    // The Prism.ViewFilter class determines which models are removed from a view.

    var ViewFilter = ViewConfig.extend({
        apply: function (silent) {
            this.view.options.filters = this.view.options.filters || {};
            this.view.options.filters[this.cid] = this.callback.call(this.component);
            if (!silent) {
                this.trigger('set', this);
            }
        }
    });

    Prism.ViewFilter = ViewFilter;

    //
    // Prism.ViewPaginator
    // -------------------
    // The Prism.ViewPaginator class features a simple view paginator.

    var ViewPaginator = ViewConfig.extend({
        // Initializes both 'page' and 'pageSize' properties
        initialize: function (view, component, pageSize, defaultPage) {
            ViewConfig.prototype.initialize.call(this, view, component);
            this.pageSize = pageSize || 10;
            this.page = defaultPage || 1;
        },

        // Returns current page
        getPage: function () {
            return this.page;
        },

        // Sets and returns the current page
        setPage: function (page) {
            this.page = page;
            return page;
        },

        // Sets the current page and updates the view configuration object
        setCurrentPage: function (page, force) {
            this.page = page;
            this.apply(!force);
        },

        // Returns current page size
        getPageSize: function () {
            return this.pageSize;
        },

        // Sets and returns current page size
        setPageSize: function (pageSize) {
            this.pageSize = pageSize;
            return pageSize;
        },

        // Returns the amount of pages required for a given total
        getTotalPages: function (total) {
            return Math.ceil(total / this.pageSize);
        },

        // Updates 'size' and 'offset' configuration options in the view
        apply: function (silent) {
            _.extend(this.view.options, {
                size: this.pageSize,
                offset: this.pageSize * (this.page - 1)
            });
            if (!silent) {
                this.trigger('set', this);
            }
        }
    });

    Prism.ViewPaginator = ViewPaginator;

    //
    // ViewBaseMixin
    // -------------
    // ViewBaseMixin implements common logic used by Prism.StateView and Prism.StoreView classes.

    var ViewBaseMixin = _.extend({
        configs: {},

        // Determines is the view is initialized
        isInitialized: function () {
            return !!this._isInitialized;
        },

        // Determines if the view is active
        // An inactive view does not listen to its parent
        isActive: function () {
            return !!this._isActive;
        },

        // Deactivates event listener
        sleep: function () {
            this.stopListening(this.parent, this.options.listenTo);
            this._isActive = false;
        },

        // Activates event listener
        wakeup: function (sync) {
            this.listenTo(this.parent, this.options.listenTo, this.sync);
            this._isActive = true;
            if (sync) {
                this.sync();
            }
        },

        // Creates and returns a new ViewConfig instance
        createConfig: function (component, callback) {
            var config = new ViewConfig(this, component, callback);
            config.cid = _.uniqueId('config');
            this._storeConfig(config);
            return config;
        },

        // Stores a ViewConfig instance
        _storeConfig: function (config) {
            // Apply new configuration when requested
            this.listenTo(config, 'set', function () {
                this.sync();
            });

            // Stop listening when destroyed
            this.listenTo(config, 'destroy', function () {
                this.stopListening(config);
                delete this.configs[config.cid];
                this.sync();
            });

            this.configs[config.cid] = config;
        }
    }, Backbone.Events);

    //
    // ViewableMixin
    // -------------
    // Mixin for 'viewable' objects.

    var ViewableMixin = {
        views: {},

        // Obtains a view by its name
        getView: function (name) {
            return this.views[name];
        },

        // Returns a default view instance for this state
        getDefaultView: function (options) {
            if (this.views['default']) {
                return this.views['default'];
            }

            return this.createView(_.extend(options || {}, {
                name: 'default'
            }));
        }
    };

    //
    // ViewableStoreMixin
    // ------------------
    // Mixin for 'viewable' store objects (Store and StoreView).

    var ViewableStoreMixin = {
        // Generates a new StoreView instance
        createView: function (options) {
            options = options || {};
            // Create view instance
            var view = new StoreView(this, options);
            view.name = options.name || _.uniqueId('view');
            this.views[view.name] = view;

            // Remove view when destroyed
            this.listenTo(view, 'destroy', function () {
                delete this.views[view.name];
            });

            return view;
        }
    };

    _.extend(ViewableStoreMixin, ViewableMixin);

    //
    // Prism.StoreView
    // ---------------
    // A Prism.StoreView instance keeps track of a Prism.Store object.

    var StoreView = Prism.StoreView = function (parent, options) {
        this.parent = parent;
        this.models = [];
        this.length = 0;
        this._isInitialized = false;
        this.options = _.extend({}, _.result(this, 'options'), options);
        this.options.listenTo = this.options.listenTo || 'add remove change reset';

        // Initialize with parent store
        this.listenTo(parent, 'publish', function () {
            // Initialize configs
            this.trigger('wakeup', true); // Indicate that this event is the first initialization

            // Synchronize models
            this.wakeup(false);
            this._isInitialized = true;

            // Synchronize with parent
            this.sync();

            //Initialize sub-views
            this.trigger('publish');
        });

        // Initialize instance
        this.initialize.apply(this, arguments);
    };

    // Include additional mixins
    _.extend(StoreView.prototype, ViewBaseMixin, ViewableStoreMixin, {
        initialize: function () {},

        // Synchronizes models against the store
        sync: function () {
            if (!this._isActive) {
                return;
            }
            this.models = _.clone(this.parent.models);

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
                    if (_.isFunction(filter)) {
                        this.models = this.filter(filter);
                    } else if (_.isObject()) {
                        var matches = _.matches(filter);
                        this.models = this.filter(function (model) {
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
                    this.models.sort(this.options.comparator.bind(this));
                }
            }

            // Set bounds
            if (this.options.size || typeof this.options.offset !== 'undefined') {
                var length = this.models.length;
                var size = this.options.size || length;
                var offset = typeof this.options.offset === 'undefined' ? 0 : Math.abs(this.options.offset);

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
        toJSON: function () {
            return this.models.map(function (model) {
                return _.extend({
                    cid: model.cid
                }, model.toJSON());
            });
        },

        // Creates and returns a new ViewFilter instance
        createFilter: function (component, callback) {
            var filter = new ViewFilter(this, component, callback);
            filter.cid = _.uniqueId('filter');
            this._storeConfig(filter);
            return filter;
        },

        // Creates and returns a new ViewComparator instance
        createComparator: function (component, callback) {
            var comparator = new ViewComparator(this, component, callback);
            comparator.cid = _.uniqueId('comparator');
            this._storeConfig(comparator);
            return comparator;
        },

        // Creates and returns a new ViewPaginator instance
        createPaginator: function (component, pageSize, defaultPage) {
            var paginator = new ViewPaginator(this, component, pageSize, defaultPage);
            paginator.cid = _.uniqueId('paginator');
            this._storeConfig(paginator);
            return paginator;
        },

        destroy: destroy
    });

    StoreView.extend = Backbone.Model.extend;

    // Inject Underscore.js methods
    var collectionMethods = {forEach: 3, each: 3, map: 3, collect: 3, reduce: 0,
      foldl: 0, inject: 0, reduceRight: 0, foldr: 0, find: 3, detect: 3, filter: 3,
      select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3, includes: 3,
      contains: 3, invoke: 0, max: 3, min: 3, toArray: 1, size: 1, first: 3,
      head: 3, take: 3, initial: 3, rest: 3, tail: 3, drop: 3, last: 3,
      without: 0, difference: 0, indexOf: 3, shuffle: 1, lastIndexOf: 3,
      isEmpty: 1, chain: 1, sample: 3, partition: 3, groupBy: 3, countBy: 3,
      sortBy: 3, indexBy: 3, findIndex: 3, findLastIndex: 3};

    addUnderscoreMethods(StoreView, collectionMethods, 'models');

    //
    // BaseMixin
    // ---------
    // BaseMixin implements common logic used by Prism.State and Prism.Store classes.

    var BaseMixin = {
        _isInitialized: false,

        // Initializes children views
        publish: function () {
            this.trigger('publish');
            this._isInitialized = true;
        }
    };

    //
    // Prism.Store
    // -----------
    // The Prism.Store class is a Backbone.Collection subclass adding a 'viewable' behavior.

    Prism.StoreMixin = _.extend({
        constructor: function (models, options) {
            this.views = {};
            Backbone.Collection.apply(this, arguments);
        }
    }, BaseMixin, ViewableStoreMixin);

    // Build Store class
    Prism.Store = Backbone.Collection.extend(Prism.StoreMixin);

    //
    // ViewableStateMixin
    // ------------------
    // Mixin for 'viewable' state objects (State and StateView).

    var ViewableStateMixin = {
        createView: function (options) {
            options = options || {};
            var view = new StateView(this, options);
            view.name = options.name ? options.name : _.uniqueId('view');
            this.views[view.name] = view;

            // Remove view when destroyed
            this.listenTo(view, 'destroy', function () {
                delete this.views[view.name];
            });

            return view;
        }
    };

    _.extend(ViewableStateMixin, ViewableMixin);

    //
    // Prism.StateView
    // ---------------
    // A Prism.StateView instance keeps track of a Prism.State object.

    var StateView = Prism.StateView = function (parent, options) {
        this.parent = parent;
        this.options = _.extend({}, _.result(this, 'options'), options);
        this.options.listenTo = this.options.listenTo || 'change';
        this._isInitialized = false;
        this._isActive = false;

        this.listenTo(parent, 'publish', function () {
            // Initialize configs
            this.trigger('wakeup', true); // Indicate that this event is the first initialization

            // Listen for changes
            this.wakeup(false);
            this._isInitialized = true;

            // Synchronize with parent
            this.sync();

            //Initialize subviews
            this.trigger('publish');
        });

        this.initialize.apply(this, arguments);
    };

    // Include additional mixins
    _.extend(StateView.prototype, ViewBaseMixin, ViewableStateMixin, {
        initialize: function () {},

        sync: function () {
            if (!this._isActive) {
                return;
            }
            this.attributes = this.parent.cid ? _.extend({
                cid: this.parent.cid
            }, this.parent.attributes) : _.extend({}, this.parent.attributes);
            this.trigger('sync');
        },

        toJSON: function () {
            return _.extend({
                cid: this.parent.cid
            }, this.attributes);
        },

        destroy: destroy
    });

    StateView.extend = Backbone.Model.extend;

    // Add Underscore.js methods to StateView class
    var modelMethods = {keys: 1, values: 1, pairs: 1, invert: 1, pick: 0,
      omit: 0, chain: 1, isEmpty: 1};

    addUnderscoreMethods(StateView, modelMethods, 'attributes');

    //
    // Prism.State
    // -----------
    // The Prism.State class is a Backbone.Model subclass adding 'viewable' behavior.

    Prism.StateMixin = _.extend({
        constructor: function (attributes, options) {
            this.views = {};
            Backbone.Model.apply(this, arguments);
        }
    }, BaseMixin, ViewableStateMixin);

    // Build State class
    Prism.State = Backbone.Model.extend(Prism.StateMixin);

    // This is the default synchronization callback
    // This function is executed using the wrapping component as its context
    // 'view' is the StoreView/StateView instance
    // 'wrappedClass' is the wrapped component class
    var defaultSyncCallback = function (view, wrappedClass) {
        // Call event handling methods (if implemented)
        // Remember, both 'viewUpdate' and 'viewTransform' act on the wrapper component
        // Use this.props.$value and this.props.$state in the wrapped component to obtain
        // any generated value generated in those methods
        if (_.isFunction(wrappedClass.prototype.viewUpdate)) {
            // When implemented, invoke the 'viewUpdate' method passing the view instance as the argument
            // Method should update the component state accordingly or force a re-render
            wrappedClass.prototype.viewUpdate.call(this, view);
        } else if (_.isFunction(wrappedClass.prototype.viewTransform)) {
            // When implemented, invoke the 'viewTransform' method passing the view instance as the argument
            // Method should return a state object that is then merged
            this.setState(wrappedClass.prototype.viewTransform.call(this, view));
        } else {
            // Default behavior, just force an update
            this.forceUpdate();
        }
    };

    //
    // Prism.compose
    // -------------
    // Returns a Higher-Order Component that wraps the given class.

    Prism.compose = function (Component, views, syncCallback) {
        var wrapper = React.createClass({
            componentWillMount: function () {
                var self = this;

                // Listen to 'sync' events triggered in the view instance
                if (_.isArray(views)) {
                    _.each(views, function (view) {
                        self.listenTo(self.props[view], 'sync',  function () {
                            if (_.isFunction(syncCallback)) {
                                syncCallback.call(self, self.props[view], Component);
                            } else {
                                defaultSyncCallback.call(self, self.props[view], Component);
                            }
                        });
                    });
                } else {
                    this.listenTo(this.props[views], 'sync', function () {
                        if (_.isFunction(syncCallback)) {
                            syncCallback.call(self, self.props[views], Component);
                        } else {
                            defaultSyncCallback.call(self, self.props[views], Component);
                        }
                    });
                }
            },

            componentWillUnmount: function () {
                var self = this;
                // Stop listening when unmounted
                if (_.isArray(views)) {
                    _.each(views, function (view) {
                        self.stopListening(self.props[view], 'sync');
                    });
                } else {
                    this.stopListening(this.props[views], 'sync');
                }
            },

            render: function () {
                var self = this;
                // Include additional properties in the wrapped component
                var props = {
                    // Obtains a state value in the wrapper component by key
                    $value: function (key) {
                        return self.state ? self.state[key] : undefined;
                    },

                    // Returns the wrapper component state
                    $state: function () {
                        return self.state;
                    },

                    // Returns the wrapper component instance
                    $parent: function () {
                        return self;
                    }
                };
                return React.createElement(Component, _.extend(props, this.props));
            }
        });
        _.extend(wrapper.prototype, Prism.Events);
        return wrapper;
    };

    return Prism;
}));
