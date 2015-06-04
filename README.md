# Backbone.Prism
Flux-like architecture for Backbone.js

<br/>
###About

<br/>
Backbone.Prism is a *Backbone.js* extension that provides additional components for implementing a [Flux](https://facebook.github.io/flux/ "")-like architecture that combines [Backbone.js](http://backbonejs.org/ "") and [React](https://facebook.github.io/react/ "").

![Backbone.Prism](http://drive.google.com/uc?export=view&id=0B3PWnBYHw7RQUVdlUkVVZ21lNm8)


<br/>
###Store

<br/>
According to the designers of Flux, a Store *"contains the application state and logic"*. The *Prism.Store* class extends *Backbone.Collection* and adds the ability to register actions into a dispatcher.

<br/>
```javascript
var Backbone = require('backbone');
var Prism = require('backbone.prism');

// Our model
var Task = Backbone.Model.extend({
    urlRoot: '/tasks'
});

// Our Store class
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
*Prism* also provides a simple mixin for rendering instances of *Prism.Store* and *Prism.State*. Any component including this mixin will expect a *view* property containing a *Prism.StoreView* or *Prism.State* instance.

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
The *view* property is then used to generate an object array in *this.state.view* containing a JSON representation of that view. The component will listen for any *sync* event in the view and update accordingly.

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
Mixins encapsulate logic that can be shared across a wide number of components. They are the preferred approach for adding interaction between a component and a dispatcher.

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
// File TaskForm.js
var React = require('react');

var TaskForm = React.createClass({
    mixins: [require('./TasksMixin')],
    
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
Mutators are objects that can modify how a *StoreView* is generated from a *Store* instance. Their main purpose is being able to apply filters and comparators to a set of models. This is done by setting the view options appropriately. A store view instance contains the following options:

<br/>
 * **offset**: The amount of models to skip from the beginning of the list.
 * **size**: The amount of models to obtain. When negative, models will be taken from the end of the list.
 * **comparator**: A comparator function/field.
 * **filter**: The default filter.
 * **filters**: An object containing a list of additional filters.

<br/>
These options could be defined when initializing a view. The following example shows a view having a capacity of 5 models ordered by priority.

```javascript
var store = require('./store');

var view = store.createView({
    size: 5,
    comparator: 'priority'
});

module.exports = view;
```

<br/>
Mutators are generated within components and allow changing those options during runtime. A mutator is created by invoking the *createMutator* method. This method expects a callback and a component instance. The callback must return an object that later will be merged with the store options object.

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

When a component takes a state that must trigger a mutator, we provide an additional argument to *setState* using the callback returned by the mutator *update* method. This method returns a function that will call the corresponding callback using the current component as the context. Right after that the mutator will trigger an *apply* event that will refresh the view contents.

```javascript
handleClick: function () {
    this.setState({page: 2}, this.pager.update());
}
```

<br/>
What if the component uses the *Prism.ViewMixin*? Wouldn't that produce a double render? In some cases it does. In order to prevent this we can use the *applyState* method that doesn't produces a refresh and then run the mutator by hand.

```javascript
handleClick: function () {
    this.applyState({page: 2});
    this.pager.apply();
}
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
            return this.state.page
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
