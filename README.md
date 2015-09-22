# Backbone.Prism

[![Build Status](https://travis-ci.org/emaphp/backbone.prism.svg?branch=master)](https://travis-ci.org/emaphp/backbone.prism)

Flux architecture for Backbone.js

<br>
###About

<br>
Backbone.Prism is a *Backbone.js* extension that provides additional classes for implementing a [Flux](https://facebook.github.io/flux/ "") architecture that combines [Backbone.js](http://backbonejs.org/ "") and [React](https://facebook.github.io/react/ "").

<br>

<br>
###Installation

<br>
##### Bower

> bower install backbone.prism --save

<br>
##### npm

> npm install backbone.prism --save

<br>
###Stores

<br>
>Notice that this documentation uses *ES6* syntax. You'll need something like [Babel](http://babeljs.io/ "") to run the examples.

<br>
According to the designers of Flux, a store *"contains the application state and logic"*. This same approach is implemented through the `Prism.Store` class, which extends `Backbone.Collection`.

<br>
```javascript
import {Model} from 'backbone';
import {Store} from 'backbone.prism';

let Task = Model.extend({
    urlRoot: '/tasks'
});

let TaskStore = Store.extend({
    model: Task,
    url: '/tasks'
});
```

<br>
###State

<br>
The `Prism.State` class is to `Backbone.Model` what `Prism.Store` is to `Backbone.Collection`. This class can be useful if your application manages a list of attributes instead of models.

<br>
```javascript
import {State} from 'backbone.prism';

let Profile = State.extend({
    url: 'profile/'
});
```

<br>
###Dispatcher

<br>
The `Prism.Dispatcher` class doesn't add much to the original Flux dispatcher except for a few methods like `handleViewAction` and `handleServerAction`.

<br>
```javascript
import {Dispatcher} from 'backbone.prism';
export default new Dispatcher();
```

<br>
###Actions

<br>
It's time to define some actions. As established by Flux, stores must register their *actions* through the dispatcher. We're going to implement a simple store using the `handleViewAction` and `handleServerAction` methods we talked previously.

<br>
```javascript
import {Store} from 'backbone.prism';
import dispatcher from './dispatcher';

let store = new Store([]);

store.dispatchToken = dispatcher.register(payload => {
	let action = payload.action;
	
	switch (action.type) {
		case 'add-item':
			store.add(action.data);
		break;
		
		case 'remove-item':
			let cid = action.data;
			let model = store.get(cid);
			store.remove(model);
		break;
		
		default:
	}
});

export default store;
```

<br>
###Views

<br>
Mutability is a b\*tch, so instead of messing around with models and collections we will create the concept of *view*. These views don't have anything to do with the `Backbone.View` class you love so much. Think at them more like the views you find in relational databases like MySQL or PostgreSQL. Views in RDBMS are an extremely useful feature because they allow to generate a subset of entities according to a given criteria. `Backbone.Prism` allows a similar approach and provides features like ordering and filtering in a very unexpensive way. Things that are important to understand about views:

 * Views are created from instances of `Prism.Store` and `Prism.State`.
 * They have nothing to do with `Backbone.Views` (we will use React for rendering HTML).
 * Views keep a collection of values/attributes that are immutable.
 * Views listen for changes in their parent store/state. When a change event is triggered they generate a new list of values/attributes.

<br>
Using views improves decoupling because we can now use them instead of models/collections to render React components.

<br>
#####StoreView

<br>
We obtain a new view using the `createView` method.

<br>
```javascript
import myStore from './store';

//Creates a view
let view = myStore.createView({
    name: 'main',            //Optional identifier
    comparator: 'created_at' //Default comparator
});

//Obtains a view by name
let view = myStore.getView('main');
```

<br>
We can also obtain a default view by calling the `getDefaultView` method.

<br>
```javascript
import myStore from './store';

let view = myStore.getDefaultView();
view.name === 'default'; // true
```

<br>
#####StateView

<br>
This works as well with the `Prism.State` class.

<br>
```javascript
import myState from './myState';

let view = myState.createView({
    name: 'main'
});
```

<br>
###Wrapping up

<br>
We've now implemented all elements required for a *Flux* architecture. The only thing left is understanding how to render a *view* using a React component. This example introduces the `Prism.compose` method and the concept of **High-Order Component**.

<br>
#####High-Order Components

<br>
We'll start by declaring a component that will render a list of items. The `TaskList` component will receive a view instance containing a list of items and render it using a simple unordered list.


<br>
```javascript
import React from 'react';
import Prism from 'backbone.prism';

class TaskList extends React.Component {
    render() {
        if (!this.props.view) {
			return (<p>Loading data...</p>);
		}
		
        let renderer = model => (<li key={model.cid}>{model.title}</li>);
        
        return (
            <ul>
                {this.props.view.map(renderer)}
            </ul>
        )
    }
}

export default Prism.compose(React, TaskList);
```

<br>
First things first: Our render method checks if a property name `view` is available. When false, we print a 'Loading data' message. In a real world application you might want to fetch some server data before doing stuff. This is a nice approach and prevents errors during initialization.
Then we create a function (using the *fat-arrow* syntax) which will render all the elements. The *view* property is a JSON representation of the entire collection with some slight modifications. For example, notice that we're setting the *key* prop to the corresponding model *cid*. This property is added to each element when exported from a view. Finally we use `map` to apply our render function to each model.
The `Prism.compose` method call you see at the end returns a wrapper class for a given component. This method expects the React object and the component class. This new class is known as **High-Order Component** and adds some necessary feature to make everything work. The class returned by this method adds the following features:

 * Starts listening for any `sync` event in the view. Changes made to a view will re-render the component.
 * Adds the `mergeState` method which is used to set a new state without triggering a re-render.
 * Remove listeners when unmounted.

<br>
If you want to now more about **High-Order Components** check out this [post](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750 "") by Dan Abramov.

<br>
#####Using views

<br>
Rendering a component using `Prism` consists in 3 steps:

 * Create a store/state instance.
 * Create a view from it.
 * Call `React.render` using the view as a property.

<br>
```
import React from 'react';
import store from './store';

//Create a default view
let storeView = store.getDefaultView();

//Render list
React.render(<TaskList view={storeView} />, document.getElementById('app'));

//Initialize all views
store.start();
```

<br>
The `start` method tells all views that the store is now ready and all views can now syc their data.



<br>
#####How does it work

<br>
The following diagram tries to explain how `Prism` works under the hood.

![Backbone.Prism](http://drive.google.com/uc?export=view&id=0B3PWnBYHw7RQOFVaMVROU3BocUk)


 * A store is modified by an event triggered from the dispatcher. A *change* event is triggered from the store.
 * The view synchonizes its data with the store. A *sync* event is triggered from the view.
 * The high-order component watching that view updates its *view* state var. This causes the component to re-render.
 * Our original component is rendered. It receives the HOC state as the property list.

<br>
```javascript
// File TaskForm.jsx
var React = require('react');
var TasksActions = require('./TasksActions');

var TaskForm = React.createClass({
    mixins: [TasksActions],
    
    getInitialState: function () {
        return {
            description: ''
        };
    },
    
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

<br>
###Transformations

<br>
Components including the *Prism.ViewMixin* can generate a custom state by implementing the *transform* method. This method receives the view instance and returns an object containing the desired state. Transformations are pretty useful for things like counters.

<br>
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

<br>
###Mutators

<br/>
Mutators are objects that can modify how a *StoreView* is generated from a *Store*. Their main purpose is being able to apply filters and comparators to a set of models by setting the view configuration appropriately. A store view supports the following list of options:

<br/>
 * **offset**: The amount of models to skip from the beginning of the list.
 * **size**: The amount of models to obtain. When negative, models will be taken from the end of the list.
 * **comparator**: A comparator function/field.
 * **filter**: The default filter.
 * **filters**: An object containing a list of additional filters.

<br>
These options could be defined when initializing a view. The following example shows a view having a capacity of 5 models ordered by priority.

<br>
```javascript
var store = require('./store');

var view = store.createView({
    size: 5,
    comparator: 'priority'
});

module.exports = view;
```

<br>
Mutators are generated within components and allow us to change those options during runtime. A mutator is created by invoking the *createMutator* method. This method expects a callback and a component instance. The callback is executed using the component instance as its context and must return a list of options that are later merged into the view.

<br>
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

<br>
In order to refresh the view's content, we provide an additional argument to *setState* using the callback returned by the mutator's *update* method. This method returns a function that will call the corresponding callback using the current component as the context. The mutator will then trigger an *apply* event that will refresh the view.

<br>
```javascript
handlePageChange: function (page) {
    this.setState({page: page}, this.pager.update());
}
```

<br>
What if the component uses the *Prism.ViewMixin*? Wouldn't that produce a double render? That could happen if a component includes *ViewMixin* and the view being modified by the mutator is the same that is being received as a property. In order to prevent this we can use the *mergeState* method.

<br>
```javascript
handleClick: function () {
    // merge state without triggering render
    // updates view after 'apply' is triggered
    this.mergeState({page: 2}, this.pager.update());
}
```

<br>
### Comparators and Filters

<br>
Comparators and filters extend the *Prism.Mutator* class allowing an easier way to apply changes to a view. Comparators are created through the *createComparator* method. This method receives a callback returning a comparator function.

<br>
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

<br>
Filters, unsurprisingly, are created through the *createFilter* method. The associated callback must return a function receiving a single model as argument.

<br>
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

<br>
### Channels

<br>
> *Don't communicate by sharing state. Share state by communicating.*

<br>
*Prism* includes [Backbone.Radio](https://github.com/marionettejs/backbone.radio "") (an extension mantained by the [Marionette.js](http://marionettejs.com/ "") team) and introduces the *Prism.Channel* class, a class featuring a full messaging API that can be used to communicate state between components. This example shows the implementation of a component using a channel to synchronize their state.

<br>
```javascript
var React = require('react');
var Prism = require('backbone.prism');
var store = require('./store');
var SomeComponent = require('./SomeComponent.jsx');
var AnotherComponent = require('./AnotherComponent.jsx');

var ParentComponent = React.createClass({
    getDefaultProps: function () {
        return {
            channel: new Prism.Channel() // Initialize channel instance
        };
    },
    
    render: function () {
        return (
            <div className="container">
                <SomeComponent channel={this.props.channel} />
                <AnotherComponent channel={this.props.channel} />
            </div>
        );
    }
});

module.exports = ParentComponent;
```

<br>
Whenever a new state is applied we communicate it to the listener component. In this case we use the *trigger* method to send the amount of clicks registered.


<br>
```javascript
var React = require('react');

var SomeComponent = React.createClass({
    getInitialState: function () {
        return {
            clicked: 0
        };
    },
    
    handleClick: function (e) {
        e.preventDefault();
        
        var channel = this.props.channel;
        var clicked = this.state.clicked + 1;
        this.setState({clicked: clicked}, (function () {
            channel.trigger('update:clicked', this.state.clicked);
        }).bind(this));
    },
    
    render: function () {
        return (
            <button onClick={this.handleClick}>Click me</button>
        );
    }
});

module.exports = SomeComponent;
```

<br>
The listener component defines a receiver callback using the *on* method. Channels also include the *request* and *reply* methods.

<br>
```javascript
var React = require('react');

var AnotherComponent = React.createClass({
    getInitialState: function () {
        return {
            clicked: 0
        };
    },
    
    componentDidMount: function () {
        this.props.channel.on('update:clicked', (function (clicked) {
            this.setState({clicked: clicked});
        }).bind(this));
    },
    
    render: function () {
        return (
            <span>Clicks: {this.state.clicked}</span>
        );
    }
});

module.exports = AnotherComponent;
```


<br>
###Demos

<br/>
 * Backbone-Prism-Todos: The classic Todo app made with Backbone.Prism ([Link](https://backbone-prism-todos.herokuapp.com "")).

<br>
###License

<br>
This library is distributed under the terms of the MIT license.
