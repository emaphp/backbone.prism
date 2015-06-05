# Backbone.Prism
Flux-like architecture for Backbone.js

<br/>
###About

<br/>
Backbone.Prism is a *Backbone.js* extension that provides additional components for implementing a [Flux](https://facebook.github.io/flux/ "")-like architecture that combines [Backbone.js](http://backbonejs.org/ "") and [React](https://facebook.github.io/react/ "").

![Backbone.Prism](http://drive.google.com/uc?export=view&id=0B3PWnBYHw7RQUVdlUkVVZ21lNm8)

<br/>
###Installation

<br/>
###### Bower

> bower install backbone.prism --save

<br/>
###### NPM

> npm install backbone.prism --save


<br/>
###Store

<br/>
According to the designers of Flux, a Store *"contains the application state and logic"*. The *Prism.Store* class extends *Backbone.Collection* and adds the ability to register actions into a dispatcher.

<br/>
```javascript
var Backbone = require('backbone');
var Prism = require('backbone.prism');

var Task = Backbone.Model.extend({
    urlRoot: '/tasks'
});

var Store = Prism.Store.extend({
    name: 'tasks', // Identifier
    model: Task,
    url: '/tasks'
});

var store = new Store();
module.exports = store;
```

<br/>
This library also provides the *Prism.State* class which can be more convenient if your application doesn't manage the state of a collection but a single model.

<br/>
###Dispatcher

<br/>
The *Prism.Dispatcher* class doesn't add much to the original Flux dispatcher except for a few methods like *handleViewAction* and *handleServerAction*.

<br/>
```javascript
var Prism = require('backbone.prism');

var dispatcher = new Prism.Dispatcher();
module.exports = dispatcher;
```

<br/>
Stores need to register themselves to the dispatcher through the *register* method. This method expects a dispatcher instance plus an object specifying the store interface.

<br/>
```javascript
var dispatcher = require('./dispatcher');

// Register actions in the dispatcher
store.register(dispatcher, {
    'add-item': function (item, options, source) {
        this.create(item, options);
    },
    
    'remove-item': function (id, options, source) {
        var model = this.get(id);
        model.destroy(options);
    }
});
```

<br/>
###StoreView

<br/>
Mutability is a b\*tch, so instead of messing around with stores we create a *store view*, a small collection-type instance that listens for changes in the original store. A store view is responsible for keeping its data up-to-date and inform the components when something changes.

<br/>
```javascript
var store = require('./store');

var mainView = store.createView({
    name: 'main',            // Optional identifier
    comparator: 'created_at' // Default comparator
});

module.exports = mainView;
```

<br/>
*Prism* also provides a simple mixin for rendering instances of *Prism.Store* and *Prism.State*. Any component including this mixin will expect a *view* property containing a *Prism.StoreView* or *Prism.StateView* instance.

<br/>
```javascript
// File: MainList.jsx
var React = require('react');
var Prism = require('backbone.prism');

var MainList = React.createClass({
    mixins: [Prism.ViewMixin],
    
    render: function() {
        var renderer = function (model) {
            return (
                <li key={model.cid}>{model.description}</li>
            );
        };
        
        return (
            <ul>{this.state.view.map(renderer)}</ul>
        );
    }
});

module.exports = MainList;
```

<br/>
The *view* property is then used to generate an object array in *state.view* containing a JSON representation of that view. The component will listen for any *sync* event in the view and update accordingly.

<br/>
```javascript
var React = require('react');
var MainList = require('./MainList.jsx');
var mainView = require('./mainView');

React.render(<MainList view={mainView}/>, document.getElementById('app'));
```

<br/>
###Mixins

<br/>
Mixins encapsulate logic that can be shared across a wide number of components. They are the preferred approach for adding interaction between a component and the dispatcher.

<br/>
```javascript
// File: TasksMixin.js
var dispatcher = require('../dispatcher');

module.exports = {
    // Adds an item to the collection
    doAddItem: function (item, options) {
        dispatcher.handleViewAction({
            type: 'tasks:add-item',
            data: item,
            options: options
        });
    },
    
    // Removes an item from the collection
    doRemoveItem: function (id, options) {
        dispatcher.handleViewAction({
            type: 'tasks:remove-item',
            data: id,
            options: options
        });
    }
};
```

<br/>
```javascript
// File TaskForm.jsx
var React = require('react');
var TasksMixin = require('./TasksMixin');

var TaskForm = React.createClass({
    mixins: [TasksMixin],
    
    handleAddItem: function(e) {
        e.preventDefault();
    
        var item = {
            description: this.state.description,
            created_at: (new Date()).getTime()
        };
        
        this.doAddItem(item);
        this.setState(this.getInitialState());
    },

    render: function () {
        // ...
    }
});

module.exports = TaskForm;
```

<br/>
###Transformations

<br/>
Components including the *Prism.ViewMixin* can generate a custom state by implementing the *transform* method. This method receives the view instance and returns an object containing the desired state. Transformations are pretty useful for things like counters.

<br/>
```javascript
var React = require('react');
var Prism = require('backbone.prism');

var Counter = React.createClass({
    mixins: [Prism.ViewMixin],
    
    transform: function (view) {
        return {
            total: view.length
        };
    },
    
    render: function () {
        return (
            <div className="counter">{this.state.total}</div>
        );
    }
});

module.exports = Counter;
```

<br/>
###Mutators

<br/>
Mutators are objects that can modify how a *StoreView* is generated from a *Store*. Their main purpose is being able to apply filters and comparators to a set of models by setting the view options appropriately. A store view supports the following list of options:

<br/>
 * **offset**: The amount of models to skip from the beginning of the list.
 * **size**: The amount of models to obtain. When negative, models will be taken from the end of the list.
 * **comparator**: A comparator function/field.
 * **filter**: The default filter.
 * **filters**: An object containing a list of additional filters.

<br/>
These options could be defined when initializing a view. The following example shows a view having a capacity of 5 models ordered by priority.

<br/>
```javascript
var store = require('./store');

var view = store.createView({
    size: 5,
    comparator: 'priority'
});

module.exports = view;
```

<br/>
Mutators are generated within components and allow us to change those options during runtime. A mutator is created by invoking the *createMutator* method. This method expects a callback and a component instance. The callback must return an object that later will be merged with the store's options object.

<br/>
```javascript
var React = require('react');

var Paginator = React.createClass({
    getInitialState: function () {
        return {
            page: 1
        };
    },

    componentDidMount: function () {
        var view = this.props.view;
        
        this.pager = view.createMutator(function () {
            var page = this.state.page;
            var pageSize = this.props.pageSize;
            
            // Set view bounds
            return {
                offset: pageSize * (page - 1),
                size: pageSize
            };
        }, this);
    },
    
    componentWillUnmount: function () {
        this.pager.destroy();
    },
    
    render: function () {
        // ...
    }
});

module.exports = Paginator;
```

<br/>
In order to refresh the view's content, we provide an additional argument to *setState* using the callback returned by the mutator's *update* method. This method returns a function that will call the corresponding callback using the current component as the context. The mutator will then trigger an *apply* event that will refresh the view.

<br/>
```javascript
handleClick: function () {
    this.setState({page: 2}, this.pager.update());
}
```

<br/>
What if the component uses the *Prism.ViewMixin*? Wouldn't that produce a double render? That could happen if a component includes *ViewMixin* and the view being modified by the mutator is the same that is being received as a property. In order to prevent this we can use the *applyState* method and then run the mutator by hand.

<br/>
```javascript
handleClick: function () {
    this.applyState({page: 2}); // merge state without triggering render
    this.pager.apply();         // apply mutator and trigger an 'apply'
}
```

<br/>
### Comparators and Filters

<br/>
Comparators and filters extend the *Prism.Mutator* class allowing an easier way to apply changes to a view. Comparators are created through the *createComparator* method. This method receives a callback returning a comparator function.

<br/>
```javascript
var React = require('react');

var OrderBar = React.createClass({
    getInitialState: function () {
        return {
            field: 'priority'
        };
    },

    componentDidMount: function () {
        var view = this.props.view;

        this.comparator = view.createComparator(function () {
            var field = this.state.field;

            return function (model1, model2) {
                if (field == 'description') {
                    return model2.get(field) < model1.get(field);
                }

                return model2.get(field) > model1.get(field);
            };
        }, this);
    },

    componentWillUnmount: function () {
        this.comparator.destroy();
    },
    
    // ...
});

module.exports = OrderBar;
```

<br/>
Filters, unsurprisingly, are created through the *createFilter* method. The associated callback must return a function receiving a single model as argument.

<br/>
```javascript
var React = require('react');
var Prism = require('backbone.prism');

var StatusFilter = React.createClass({
    mixins: [Prism.ViewMixin],
    
    componentDidMount: function () {
        var view = this.props.mainView;

        this.filter = view.createFilter(function () {
            var filter = this.state.selected;

            return function (model) {
                switch (filter) {
                    case 'all': return true;
                    case 'active': return !model.get('closed');
                    case 'closed': return model.get('closed');
                }
            };
        }, this);
    },
    
    componentWillUnmount: function () {
        this.filter.destroy();
    },
    
    // ...
});

module.exports = StatusFilter;
```

<br/>
### Channels

<br/>
*Prism* uses [Backbone.Radio](https://github.com/marionettejs/backbone.radio "") to turn views into full featured application channels. By including the *Backbone.Radio.Commands* and *Backbone.Radio.Requests* mixins, views can send commands and requests between components.

<br/>
```javascript
var React = require('react');
var Prism = require('backbone.prism');

var Paginator = React.createClass({
    mixins: [Prism.ViewMixin],

    getInitialState: function () {
        return {
            page: 1
        };
    },

    componentDidMount: function () {
        var view = this.props.view;

        this.paginator = view.createMutator(function () {
            var page = this.state.page;
            var pageSize = this.props.pageSize;

            return {
                offset: pageSize * (page - 1),
                size: pageSize
            };
        }, this);

        // Reset page number when requested
        view.comply('page:reset', (function () {
            this.applyState({page: 1});
            this.paginator.apply(true); // don't trigger any event, wait for view 'sync'
        }).bind(this));
        
        // Return current page
        view.reply('page:get', (function () {
            return this.state.page;
        }).bind(this));
    },
    
    // ...
});

module.exports = Paginator;
```

<br/>
```javascript
// Reset page
view.command('page:reset');

// Get current page
var page = view.request('page:get');
```

<br/>
###Demos

<br/>
 * Backbone-Prism-Todos: The classic Todo app made with Backbone.Prism ([Link](https://backbone-prism-todos.herokuapp.com "")).

<br/>
###License

<br/>
This library is distributed under the terms of the MIT license.
