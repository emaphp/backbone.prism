    *** WORK IN PROGRESS ***

# Backbone.Prism
Flux-like architecture for Backbone.js

<br/>
###About

<br/>
Backbone.Prism is a *Backbone.js* extension that provides additional components for implementing a [Flux](https://facebook.github.io/flux/ "")-like architecture that combines [Backbone.js](http://backbonejs.org/ "") and [React](https://facebook.github.io/react/ "").

![Backbone.Prism](http://drive.google.com/uc?export=view&id=)


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
Instead of messing around with stores we create a *store view*, a small collection-type instance that listens for changes in the original store. This store view is responsible for keeping its data up-to-date and inform the React component when something changes.

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
            <ul key={'mainList'}>{this.state.view.map(renderer)}</ul>
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
Mutators are objects that can modify how a *StoreView* is generated from a store instance. Their main purpose is being able to apply filters and comparators to a set of models.

<br/>
###Demos

<br/>
 * Backbone-Prism-Todos: The classic Todo app made with Backbone.Prism (Link).

<br/>
###License

<br/>
This library is distributed under the terms of the MIT license.
