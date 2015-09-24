# Backbone.Prism

[![Build Status](https://travis-ci.org/emaphp/backbone.prism.svg?branch=master)](https://travis-ci.org/emaphp/backbone.prism)

Flux architecture for Backbone.js

<br>
![Backbone.Prism](http://drive.google.com/uc?export=view&id=0B3PWnBYHw7RQVnluNV9oSjY0UHM)

<br>
###About

<br>
Backbone.Prism is a *Backbone.js* extension that provides additional classes for implementing a [Flux](https://facebook.github.io/flux/ "") architecture that combines [Backbone.js](http://backbonejs.org/ "") and [React](https://facebook.github.io/react/ "").

<br>
>Notice that this documentation uses *ES6* syntax. You'll need something like [Babel](http://babeljs.io/ "") to run the examples. If you're unsure of how to write your components in ES6 make sure to read this [post](http://www.tamas.io/react-with-es6/ "") by Tamas Piros.

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
According to the designers of *Flux*, a store *"contains the application state and logic"*. This same approach is implemented through the `Prism.Store` class, which extends `Backbone.Collection`.

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
    url: '/profile'
});
```

<br>
###Dispatcher

<br>
The `Prism.Dispatcher` class doesn't add much to the original *Flux* dispatcher except for a few methods like `handleViewAction` and `handleServerAction`.

<br>
```javascript
//File: dispatcher.js
import {Dispatcher} from 'backbone.prism';
export default new Dispatcher();
```

<br>
###Actions

<br>
It's time to define some *actions*. Let's start by building a simple store. As established by *Flux*, stores must register their actions through the dispatcher.

<br>
```javascript
//File: store.js
import {Model} from 'backbone';
import {Store} from 'backbone.prism';
import dispatcher from './dispatcher';

let Task = Model.extend({
    urlRoot: '/tasks'
});

let TaskStore = Store.extend({
    model: Task,
    url: '/tasks'
});

let store = new TaskStore([
    new Task({ title: 'Do some coding', priority: 3 }),
    new Task({ title: '(Actually) make some tests', priority: 2 }),
    new Task({ title: 'Check out that cool new framework', priority: 1 }),
    new Task({ title: 'Make some documentation', priority: 1 }),
    new Task({ title: 'Call Saoul', priority: 3 })
]);

store.dispatchToken = dispatcher.register(payload => {
	let action = payload.action;
	
	switch (action.type) {
		case 'add-task':
			store.add(new Task(action.data));
		break;
				
		default:
	}
});

export default store;
```

<br>
We need to provide a dead-simple interface to those actions. A simple mixin will do.

<br>
```javascript
//File: actions.js
import dispatcher from './dispatcher';

let TaskActions = {
    addTask(task) {
        dispatcher.handleViewAction({
            type: 'add-task',
            data: task
        });
    }
};

export default TaskActions;
```

<br>
That's it for now. In order to progress further we need to introduce the main component of Backbone.Prism: the *view*.

<br>
###Views

<br>
Mutability is a b\*tch, so instead of messing around with models and collections we'll introduce the concept of *view*. These views don't have anything to do with the `Backbone.View` class. Think at them more like the views you find in relational databases like MySQL or PostgreSQL. Views in RDBMS are an extremely useful feature because they allow to generate a subset of entities for a given criteria. *Backbone.Prism* allows a similar approach and allows features like ordering and filtering in a simple manner. Things that are important to understand about views:

 * Views are created from instances of `Prism.Store` and `Prism.State`.
 * They aren't related to the `Backbone.View` class (we will use React for rendering HTML).
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
import store from './store';

//Creates a view
let view = store.createView({
    name: 'main',           //Optional identifier
    comparator: 'priority'  //Default comparator
});

//Obtains a view by name
let view = store.getView('main');
```

<br>
We can also obtain a default view by calling the `getDefaultView` method.

<br>
```javascript
import store from './store';

let view = store.getDefaultView();
view.name === 'default'; // true
```

<br>
#####StateView

<br>
This works as well with the `Prism.State` class.

<br>
```javascript
import state from './state';

let view = state.createView({
    name: 'main'
});
```

<br>
###Wrapping up

<br>
We've now implemented all elements required for a *Flux* architecture. The only thing left is understanding how to render a *view* using a React component. This example introduces the `Prism.compose` method and the concept of **Higher-Order Component**.

<br>
#####Higher-Order Components

<br>
We'll start by implementing the `TaskList` class, a component that will receive a view instance containing a list of tasks and render it using a simple unordered list.

<br>
```javascript
//File: TaskList.jsx
import React from 'react';
import Prism from 'backbone.prism';

class TaskList extends React.Component {
    render() {
        if (!this.props.view.isInitialized()) {
			return (<p>Loading data...</p>);
		}
		
        let values = this.props.values();
        let view = values.view;
        let renderer = model => (<li key={model.cid}>{model.title}</li>);
        
        return (
            <ul>
                {view.map(renderer)}
            </ul>
        );
    }
}

export default Prism.compose(React, TaskList);
```

<br>
First things first: Our render method checks if a property name `view` is initialized. This ensures that the view instance is synchronized against the store. When false, we print a default *'Loading data'* message. In a real world application you might want to fetch some server data before doing stuff. This is a nice approach and prevents errors during initialization.<br>
If the view is correctly initialized a special method called `values` is injected in `props`. Values obtained from that method are generated before the component is rendered and can contain different representations of the view instance.<br>
We then define a render function using the *fat-arrow* syntax. The *view* property available in *values* is a JSON representation of the entire view with some slight modifications. For example, notice that we're setting the *key* prop to the corresponding model *cid*. This property is added to each element when exported from a view. Finally we use `map` to apply our render function to each model.
The `Prism.compose` method call you see at the end returns a wrapper class for a given component. This method expects the React object and the component class. This new class is known as **Higher-Order Component** and adds some necessary features to make everything work:

 * Starts listening for any `sync` event in the view. Changes made to a view will re-render the component.
 * When a change event is triggered, it will update its state. State vars are then made available to the original component through the `values` method.
 * Removes listeners when unmounted.

<br>
By default, the **Higher-Order Component** keeps a JSON representation of the view in the *view* state var, but this behavior can be modified. If you want to now more about **Higher-Order Components** check out this [post](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750 "") by Dan Abramov.

<br>
#####Using views

<br>
Rendering a component using `Prism` consists in 3 steps:

 * Create a store/state instance.
 * Create a view from it.
 * Call `React.render`. Pass the view as a prop.

<br>
The following code is a simple example of how to achieve this:

<br>
```javascript
//File: main.js
import React from 'react';
import TaskList from './TaskList.jsx';
import store from './store';

//Create a default view
let storeView = store.getDefaultView();

//Render list
React.render(<TaskList view={storeView} />, document.getElementById('app'));

//Initialize all views
store.start();
```

<br>
The `start` method tells all views that the store is ready and they're able to sync their data. This is pretty useful because it allows the developer to only initialize components when data is available (ex: we fetched a collection from the server).

<br>
#####Event/Data flow

<br>
The following diagram tries to explain how *Backbone.Prism* works under the hood.

![Backbone.Prism](http://drive.google.com/uc?export=view&id=0B3PWnBYHw7RQOFVaMVROU3BocUk)


 * An action is executed that modifies the store. A *change* event is triggered.
 * The view synchonizes its data with the store. A *sync* event is triggered.
 * The higher-order component updates its *view* state var. This causes the component to re-render.
 * Our original component is rendered.

<br>
###The TaskApp component

<br>
Our application is not yet complete. Let's add a form component so we can add more tasks to our store. We're using the `TaskActions` mixin we implemented previously.

<br>
```javascript
//File: TaskForm.jsx
import React from 'react';
import TaskActions from './actions';

class TaskForm extends React.Component {
    constructor(props) {
        super(props);
        
        //Set initial state
        this.state = {
            title: '',
            priority: 1
        };
    }
    
    handleInputTitle(e) {
        let value = $(e.target).val();
        this.setState({
            title: value
        });
    }

    handleSelectPriority(e) {
        let value = $(e.target).val();
        this.setState({
            priority: value
        });
    }
    
    handleSubmit(e) {
        e.preventDefault();

        if (!this.state.title) {
            return;
        }

        let task = {
            title: this.state.title,
            priority: this.state.priority
        };

        //Add task
        TaskActions.addTask(task);
        
        //Reset state
        this.setState({
            title: '',
            priority: 1
        });
    }
    
    render() {
        return (
            <form onSubmit={this.handleSubmit.bind(this)}>
                <input type="text" value={this.state.title} onChange={this.handleInputTitle.bind(this)}/>
                <select value={this.state.priority} onChange={this.handleSelectPriority.bind(this)}>
                    <option value="1">Low</option>
                    <option value="2">Normal</option>
                    <option value="3">High</option>
                </select>
            </form>
        );
    }
}

export default TaskForm;
```

<br>
We have a form and a list, it's time to put them together using the `TaskApp` component.

<br>
```javascript
//File: TasksApp.jsx
import React from 'react';
import store from './store';
import TaskList from './TaskList.jsx';
import TaskForm from './TaskForm.jsx';

class TasksApp extends React.Component {
    componentWillMount() {
        this.view = store.getDefaultView();
    }
    
    render() {
        return (
            <div>
                <TaskList view={this.view} />
                <TaskForm />
            </div>
        );
    }
}

export default TasksApp;
```

<br>
###Transformations

<br>
Until now we've seen that the value imported from the higher-order component consist in a single object containing a *view* property the corresponding JSON representation. In order to tell the component which property must be exported we'll define a `transform` method. This method receives a view instance and returns an object containing the values that are then sent to the component. The next example introduces the `TaskCounter` component, a component that will render the amount of tasks in the list.

<br>
```javascript
//File: TaskCounter.jsx
import React from 'react';
import Prism from 'backbone.prism';

class TaskCounter extends React.Component {
    transform(view) {
        return {
            total: view.length
        };
    }
    
    render() {
        let values = this.props.values();
        
        return (
            <p>Total: {values.total}</p>
        ):
    }
}

export default Prism.compose(React, TaskCounter);
```

<br>
Time to add the component to our app. Both `TaskList` and `TaskCounter` can share the same view instance.

<br>
```javascript
//File: TasksApp.jsx
import React from 'react';
import store from './store';
import TaskList from './TaskList.jsx';
import TaskCounter from './TaskCounter.jsx';
import TaskForm from './TaskForm.jsx';

class TasksApp extends React.Component {
    componentWillMount() {
        this.view = store.getDefautView();
    }
    
    render() {
        return (
            <div>
                <TaskList view={this.view} />
                <TaskCounter view={this.view} />
                <TaskForm />
            </div>
        );
    }
}

export default TasksApp;
```


<br>
###Mutators

<br/>
Mutators are objects that define how a view is generated from a store instance. They allow to change a view configuration values during runtime. A store view supports the following options:

 * comparator: A model field or a comparator function.
 * filter: A filter function or an object with the desired criteria to apply to the collection.
 * offset: The amount of elements to skip from the beginning of the collection.
 * size: The total amount of elements to obtain. When negative, elements will be taken from the end of the collection.

<br>
These options could be defined when initializing a view. The following example shows a view having a size of 5 elements ordered by priority.

<br>
```javascript
import store from './store';

let view = store.createView({
    size: 5,
    comparator: 'priority'
});
```

<br>
Mutators are generated within components through the `createMutator` method. This method expects a callback and a context variable. The callback is executed using the context provided (usually the component itself) and must return a list of options that are later merged into the view. For our first example we'll implement the `TaskPaginator` component. This component will provide a pagination mechanism for our task list.

<br>
```javascript
import React from 'react';
import Prism from 'backbone.prism'
import Underscore from 'underscore';

class TaskPaginator extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            page: 1
        };
    }

    componentWillMount() {
        let view = this.props.view;
        this.store = view.parent
        
        this.paginator = view.createMutator(() {
            let page = this.state.page;
            let pageSize = this.props.pageSize;
            
            return {
                offset: pageSize * (page - 1),
                size: pageSize
            };
        }, this);
    }
    
    componentWillUnmount() {
        this.paginator.destroy();
    }
    
    handlePageClick(e) {
        e.preventDefault();

        // Update state silently and evaluate mutator
        this.paginator.update(this, {page: +e.target.innerHTML});
    }
    
    render() {
        if (!this.props.view.isInitialized()) {
            return (<div></div>);
        }
        
        if (this.store.length <= this.props.pageSize) {
            return (
                <div>
                    <span>1</span>
                </div>
            );
        }
        
        let pages = Math.ceil(this.store.length / this.props.pageSize);
        let renderer = (page => {
            return (
                <a key={page} href="#" onClick={this.handlePageClick.bind(this)}>{page + 1}</a>
            );
        }).bind(this);
        
        return (
            <div>
                {Underscore(pages).times(renderer)}
            </div>
        );
    }
}

export default Prism.compose(React, TaskPaginator);
```

<br>
The `TaskPaginator` components starts by defining its initial state. The only required value is the current page number. Then it proceeds to initialize a mutator instance by providing a function that returns the set of options that we're interested, in this case, the *size* and *offset* values. Notice that we're storing a reference to the original store in order to know the total amount of pages available. When rendering the element, we again check if the view is initialized correctly. We calculate the amount of pages and define a render function. We finally use the `times` helper function to render a link for each page. In order to update the component state we use the `update` method in the mutator instance. This method updates the component state without triggering a re-render. This is done on purpose because the paginator needs to trigger an event in order to tell the view that it must update its contents. The paginator is evaluated and then it triggers a *apply* event which updates the view with the current configuration.

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
*Prism* includes [Backbone.Radio](https://github.com/marionettejs/backbone.radio "") (an extension mantained by the [Marionette.js](http://marionettejs.com/ "") team) and introduces the `Prism.Channel` class, a class featuring a full messaging API that can be used to communicate state between components. This example shows the implementation of a component using a channel to synchronize their state.

<br>
```javascript
//File: ChannelComponent.jsx
import React from 'react';
import {Channel} from 'backbone.prism';
import EmitterComponent from './EmitterComponent.jsx';
import ListenerComponent from './ListenerComponent.jsx';

class ChannelComponent extends React.Component {
    constructor(props) {
        super(props);
        this.channel = new Channel();
        this.channel.reply('initialize', { clicked: 0 });
    }
    
    render() {
        return (
            <div>
                <EmitterComponent channel={this.channel} />
                <ListenerComponent channel={this.channel} />
            </div>
        );
    }
}

export default MainComponent;
```

<br>
Whenever a new state is applied we communicate it to the listener component. In this case we use the *trigger* method to send the amount of clicks registered.


<br>
```javascript
//File: EmitterComponent.jsx
import React from 'react';

class EmitterComponent extends React.Component {
    contructor(props) {
        super(props);
        this.state = this.props.channel.request('initialize');
    }
    
    handleClick(e) {
        e.preventDefault();
        
        let channel = this.props.channel;
        let clicked = this.state.clicked + 1;
        this.setState({clicked}, () => {
            channel.trigger('update:clicked', clicked);
        });
    }
    
    render() {
        return (
            <button onClick={this.handleClick.bind(this)}>Click me</button>
        );
    }
}

export default EmitterComponent;
```

<br>
The listener component defines a receiver callback using the *on* method. Notice that we're also using *request* and *reply* to initialize both components.

<br>
```javascript
//File: ListenerComponent.jsx
import React from 'react';

class ListenerComponent extends React.Component {
    contructor(props) {
        super(props);
        this.state = this.props.channel.request('initialize');
    }
    
    componentDidMount() {
        this.props.channel.on('update:clicked', (clicked => {
            this.setState({clicked});
        }).bind(this));
    }
    
    render() {
        return (
            <span>Clicks: {this.state.clicked}</span>
        );
    }
}

export default ListenerComponent;
```


<br>
###Demos

<br/>
 * Backbone-Prism-Todos: The classic Todo app made with Backbone.Prism ([Link](https://backbone-prism-todos.herokuapp.com "")).

<br>
###License

<br>
This library is distributed under the terms of the MIT license.
