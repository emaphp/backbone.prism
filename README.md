Backbone.Prism
=

[![Build Status](https://travis-ci.org/emaphp/backbone.prism.svg?branch=master)](https://travis-ci.org/emaphp/backbone.prism)

Flux architecture for Backbone.js

<br>
About
===

Backbone.Prism features a [Flux](https://facebook.github.io/flux/ "") based architecture combining [Backbone.js](http://backbonejs.org/ "") and [React](https://facebook.github.io/react/ "").

<br>
Demo
===

<br>
([Backbone-Prism-Todos](https://backbone-prism-todos.herokuapp.com "")): A classic Todo app featuring filters, sorting and pagination, done in Backbone.Prism.

<br>
Installation
===

<br>
Bower
======

> bower install backbone.prism --save

<br>
npm
=====

> npm install backbone.prism --save

<br>
Introduction
===

<br>
Backbone.Prism is a Backbone.js library that features a set of classes and utilities for implementing applications using the `Flux` architecture. This library includes:

<br>
 * A `Store` and a `State` class, based on `Backbone.Collection` and `Backbone.Model` respectively.
 * A `Dispatcher` class based on `Flux.Dispatcher`.
 * A `StoreView` and a `StateView` class, both defining an interface for `viewable models`.
 * An utility function for generating *Higher-Order Components* in `React`.
 * A `Channel` class for allowing communication between components.

<br>
Viewable Models
====

<br>
Prism introduces the concept of `viewable model`. A `Store` instance, for example, is a viewable collection, meaning that it can have many `store views` associated. These `model views` represent a particular set of data present in a model and the way it should be rendered. The concept is pretty similar to the one found in RDBMS, where a `view` is a result set returned by a query.

<br>
```javascript
import Prism from 'backbone.prism';

// Prism.Store is a 'viewable' Backbone.Collection
let store = new Prism.Store([
  { name: 'Eiffel Tower', location: 'France' },
  { name: 'Taj Mahal', location: 'India' },
  { name: 'Louvre Museum', location: 'France' },
  { name: 'Machu Picchu', location 'Peru' }
]);

// Create a view only holding a particular set of data
let view = store.createView({
  name: 'france',
  filter: model => {
    return model.get('location') === 'France';
  }
});

// Make models available in all views
store.publish();

console.log(view.length); // prints '2'
```

<br>
When a `Store` instance calls the `publish` method, all `store views` will start listening for changes. Any element added/removed/modified on the store will trigger a sync routine.

<br>
```javscript
// Adding an element to a store will trigger an event
store.add({
  { name: 'Arc de Triomphe', location: 'France' }
});

// Views will listen for these types of event and sync their data again
console.log(view.length); // prints '3'
```

<br>
The real advantage of using `model views` is that they can also hold a list of options describing how a model should be rendered. Before showing how this process works, lets first introduce the concept of `Higher-Order Component`. This section assumes you are familiar with `React` and how to render a `React Component`.

<br>
Higher-Order Components
====

<br>
The idea behind using `Higher-Order Components` is replacing the use of mixins by wrapping a user-defined component into another. This wrapping component is generated through a function that takes a component class and returns a wrapper. That way, instead of using mixins that end up cluttering our component, we manage a particular logic in the wrapper component and let it decide how its child component should be rendered.
A full explanation of how `Higher-Order Components` really work would take a lot of space. If you want to now more about **Higher-Order Components** check out this [post](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750 "") written by Dan Abramov.

<br>
Prism generates this type of component through the `compose` function. This function takes a component class and a list of props that will contain `model views`. The resulting component will listen for changes in the specified props. When a change is detected the component will re-render.

<br>
```javascript
// file: MyComponent.jsx
import React from 'react';
import Prism from 'backbone.prism';

class MyComponent extends React.Component {
  // ...
}

export default Prism.compose(MyComponent, ['view']);
```

<br>
This simplifies the process of binding a component to a view. In order to use this component we need to provide a valid `model view` as the `view` prop.

<br>
```javascript
// file: MainComponent.jsx
import React from 'react';
import store from './store';
import MyComponent from './MyComponent.jsx';

class MainComponent extends React.Component {
  componentWillMount() {
    this.defaultView = store.getDefaultView();
  }
  
  componentDidMount() {
    store.publish();
  }
  
  componentWillUnmount() {
    this.defaultView.destroy();
  }
  
  render() {
    return (<div>
      <MyComponent view={this.defaultView} />
    </div>);
  }
}

export default MainComponent;
```

<br>
The next section illustrates this concept by building a simple list app.

<br>
A demo app in Backbone.Prism
===

<br>
This app will show a list of landmarks using a `Store` and two `React` components. Lets create the list of landmarks using a simple `Store`:

<br>
```javascript
// file: demostore.js
import Prism from 'backbone.prism';

let store = new Prism.Store([
  { name: 'Eiffel Tower', location: 'France' },
  { name: 'Taj Mahal', location: 'India' },
  { name: 'Machu Picchu', location 'Peru' },
  { name: 'Statue of Liberty', location: 'USA' },
  { name: 'The Great Wall', location: 'China' },
  { name: 'Brandenburg Gate', location: 'Germany' }
]);

export default store;
```

<br>
The first component will represent the app itself. It will be responsible of generating a default view for the list component.

<br>
```javascript
// file: DemoApp.jsx
import React from 'react';
import store from './demostore';
import LandmarkList from './LandmarkList.jsx';

class DemoApp extends React.Component {
  componentWillMount() {
    this.defaultView = store.createDefaultView();
  }
  
  componentDidMount() {
    store.publish();
  }
  
  componentWillUnmount() {
    this.defaultView.destroy();
  }
  
  render() {
    return (<div>
      <h3>Landmarks of the World</h3>
      <LandmarkList view={this.defaultView} />
    </div>);
  }
}

export default DemoApp;
```

<br>
The `LandmarkList` component needs to listen to the `view` prop. Any change in that prop (or its parent store) should trigger a re-render.

<br>
```javascript
// file: LandmarkList.jsx
import React from 'react';
import Prism from 'backbone.prism';

class LandmarkList extends React.Component {
  render() {
    let list = this.props.view;
    let render = model => {
      return (<li key={model.cid}>{model.get('name')} ~ <em>{model.get('location')}</em></li>);
    };
    
    return (<ul>{list.map(render)}</ul>);
  }
}

export default Prism.compose(LandmarkList, ['view']);
```

<br>
Finally, we render our app using `react-dom`.

<br>
```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import DemoApp from './DemoApp.jsx';

ReactDOM.render(<DemoApp />, document.getElementById('app'));
```

<br>
This application must be bundled using Browserify or Webpack combined with Babel. For the sake of brevity we're going to omit this step.

<br>
Better initialization
====

<br>
In a real world application you might have to fetch data from the server, meaning that the component will be rendered before any data is ready. We can check if a given view is properly initialized with the `isInitialized` method. That way we can provide a meaningful message to alert that no data is available at the moment.

<br>
```javascript
// file: LandmarkList.jsx
import React from 'react';
import Prism from 'backbone.prism';

class LandmarkList extends React.Component {
  render() {
    let list = this.props.view;
    let render = model => {
      return (<li key={model.cid}>{model.get('name')} ~ <em>{model.get('location')}</em></li>);
    };
    
    // Check if data is available
    if (!list.isInitialized()) {
      return (<div>Fetching data...</div>);
    }
    
    return (<ul>{list.map(render)}</ul>);
  }
}

export default Prism.compose(LandmarkList, ['view']);
```

<br>
We can simulate this process by delaying the call to `publish` in the main component.

<br>
```javascript
  componentDidMount() {
    setTimeout(() => store.publish(), 3000);
  }
```

<br>
Now the component will show a little message before rendering the list.

<br>
Working with views
===

<br>
The simplest way of creating a view is through the `getDefaultView` method.

<br>
```javascript
import store from './store';

let view = store.getDefaultView();
view.name === 'default'; // true
```

<br>
Both this method and `createView` accept an object containing a set of options. This object can contain the following properties:

<br>
 * name: A name that identifies this view. You can obtain a view by name through the `getView` method.
 * comparator: A function or property name used to sort the collection.
 * filter: A function used for filtering models in a collection.
 * size: The amount of elements to hold.
 * offset: The amount of elements to omit from the beginning.
 
<br>
View configuration
====

<br>
Views provide an easy mechanism for changing configuration options through `configs`. A `ViewConfig` object sets a particular list of options in a view and then notifies the view through an event (the `set` event). The next example implements a component that defines the amount of elements to show on a list.

<br>
```javascript
import React from 'react';

class ListSizeSelector extends React.Component {
  constructor(props) {
    super(props);
    
    // Initialize component state
    this.state = {
      size: 5
    };
  }
}

export default ListSizeSelector;
```

<br>
This component will store the amount of elements to show in a state var. We'll initialize the `ViewConfig` element in the `componentWillMount` method.

<br>
```javascript
  componentWillMount() {
    this.config = this.view.createConfig(this, () => {
      return {
        size: this.state.size
      };
    });
  }
  
  componentWillUnmount() {
    this.config.destroy();
  }
```

<br>
The `createConfig` method expects a context object, generally the component itself, and a configuration callback. This callback gets invoked after calling the `apply` method and uses the context provided during the initialization. The configuration object returned by this callback is then merged against the view configuration. We need to make sure we destroy the configuration object once the component is unmounted.

<br>
```javascript
  render() {
    let options = [3, 5, 10];
    let render = value => {
      return (<option key={value} value={value}>{value}</option>);
    };
    
    return (<select value={this.state.size} onChange={this.onOptionChange.bind(this)}>{options.map(render)}</select>);
  }
```

<br>
The handler gets the selected value and updates the component state. We provide an additional callback that updates the view.

<br>
```javascript
  onOptionChange(e) {
    let self = this;
    let value = +e.target.value;
    this.setState({size: value}, () => {
      self.config.apply();
    });
  }
```

<br>
A more elegant version of the above could be achieved using the `eval` method. This methods returns a callback that applies the new configuration.

<br>
```javascript
  onOptionChange(e) {
    let value = +e.target.value;
    this.setState({size: value}, this.config.eval());
  }
```

<br>
Once the configuration is applied the view triggers an event that notifies all listening components that a change has been made.

<br>
Comparators
====

<br>
A comparator simply applies a sort algorithm to a collection. This is done by calling the `createComparator` method and specifying a callback that returns either a field name or a sorting function.

<br>
```javascript
import React from 'react';

class ListOrderSelector extends React.Component {
  constructor(props) {
    super(props);
    
    // Initialize component state
    this.state = {
      field: 'name',
      ascending: true
    };
  }

  componentWillMount() {
    // Setup comparator
    this.comparator = this.props.view.createComparator(this, () => {
      let field = this.state.field;
      let ascending = this.state.ascending;
    
      return (model1, model2) => {
        if (model1.get(field) < model2.get(field)) {
          return ascending ? -1 : 1;
        } else if (model1.get(field) > model2.get(field)) {
          return ascending ? 1 : -1;
        }
      
        return 0;
      };
    });
  }
  
  componentWillUnmount() {
    this.comparator.destroy();
  }
  
  handleFieldChange(e) {
    // Update state and apply comparator
    let value = e.target.value;
    this.setState({field: value}, this.comparator.eval());
  }

  handleOrderChange(e) {
    let value = e.target.value == 'Ascending';
    this.setState({ascending: value}, this.comparator.eval());
  }
  
  render() {
    let fields = ['name', 'location'];
    let options = ['Ascending', 'Descending'];
    
    return (<div>
      <p>
        <em>Order by:</em>
        <select value={this.field} onChange={this.handleFieldChange.bind(this)}>
          {fields.map(field => {
            return (<option key={field} value={field}>{field.substring(0,1).toUpperCase() + field.substring(1)}</option>);
          })}
        </select>
      </p>
      <p>
        <em>Sorting order:</em>
        <select value={this.state.ascending ? 'Ascending' : 'Descending'} onChange={this.handleOrderChange.bind(this)}>
          {options.map(order => {
            return (<option key={order} value={order}>{order}</option>);
          })}
        </select>
      </p>
    </div>);
  }
}

export default ListOrderSelector;
```
<br>
Paginators
====

<br>
Paginators offers a simple way of separating a big list of elements into smaller sets. We begin by calling the `createPaginator` method passing the component instance, the page size and the initial page. Once done, we simply update the page number through `setPage` and apply the new configuration. Keep in mind that pagination components still need to listen for changes in the view that contains the elements we want to paginate. These kind of components are an example of components that listen to a view but apply modifications to another.

<br>
```javascript
// file: ListPaginator.jsx
import React from 'react';
import Prism from 'backbone.prism';
import _ from 'underscore';

class ListPaginationBar extends React.Component {
  constructor(props) {
    super(props);
    
    // Initialize component state
    this.state = {
      page: 1
    };
  }
  
  componentWillMount() {
    // Setup pagination
    this.paginator = this.props.paginateOn.createPaginator(this, this.props.pageSize, this.state.page);
  }
  
  componentWillUnmount() {
    this.paginator.destroy()
  }
  
  handlePageClick(e) {
    e.preventDefault();
    
    // Update component state and apply pagination
    let page = +e.target.innerHTML;
    this.paginator.setPage(page);
    this.setState({page}, this.paginator.eval());
  }
  
  render() {
    // Get amount of pages available
    let totalPages = this.paginator.getTotalPages(this.props.view.length);
    let render = counter => {
      return (<a href="#" key={counter} onClick={this.handlePageClick.bind(this)}>{counter + 1}</a>)
    };
    
    return (<div>
      {_(totalPages).times(render)}
      <small>Showing page {this.state.page} of {totalPages}</small>
    </div>);
  }
}

export default Prism.compose(ListPaginationBar, ['view']);
```

<br>
Now we need to update the way views are managed in the main component. We add a new paginated view that will listen for changes in the default view. Notice that this view will need to listen for a different type of event (`sync`). These types of view are called `subviews`.

<br>
```javascript
// file: DemoApp.jsx
import React from 'react';
import store from './demostore';
import LandmarkList from './LandmarkList.jsx';
import ListOrderSelector from './ListOrderSelector.jsx';
import ListPaginationBar from './ListPaginationBar.jsx';

class DemoApp extends React.Component {
  componentWillMount() {
    this.defaultView = store.createDefaultView();
    
    // Create paginated subview
    this.paginatedView = this.defaultView.createView({
      name: 'paginated',
      listenTo: 'sync'
    });
  }
  
  componentDidMount() {
    store.publish();
  }
  
  componentWillUnmount() {
    this.defaultView.destroy();
  }
  
  render() {
    return (<div>
      <h3>Landmarks of the World</h3>
      <ListOrderSelector view={this.defaultView} />
      <LandmarkList view={this.paginatedView} />
      <ListPaginationBar view={this.defaultView} paginateOn={this.paginatedView} />
    </div>);
  }
}

export default DemoApp;
```

<br>
Filters
====

<br>
Filters are pretty straightforward. This time we invoke the `createFilter` method passing a context object and a callback. Callbacks can return either a filter function or an object setting a specific criteria. This example sets a filter combining a regex and the [debounce](http://underscorejs.org/#debounce) function utility.

<br>
```javascript
// file: ListFilter.jsx
import React from 'react';
import Prism from 'backbone.prism';
import _ from 'underscore';

class ListFilter extends React.Component {
  constructor(props) {
    super(props);
    
    // Initialize filter state
    this.state = {
      filter: ''
    };
  }
  
  componentWillMount() {
    // Initialize filter
    this.filter = this.props.filterOn.createFilter(this, () => {
      let value = this.state.filter;
      let regex = new RegExp(value.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1"), 'i');
      return model => value === '' ? true : model.get('name').match(regex);
    });
    
    // Build a debounced callback to avoid any blocking behavior
    this.filterCallback = _.debounce(this.filter.eval(), 250);
  }
  
  componentWillUnmount() {
    this.filter.destroy();
  }
  
  handleInputChange(e) {
    let value = e.target.value;
    this.setState({filter: value}, this.filterCallback);
  }

  render() {
    return (<div>
      <input onChange={this.handleInputChange.bind(this)} value={this.state.filter} />
    </div>);
  }
}

export default ListFilter;
```

<br>
But now our app has a flaw. If you navigate to the last page and then input a letter in our newly created filter we obtain an empty list. This is because the view is still using the offset applied through the pagination component. What we obtain is an `out of bounds view`. To solve this issue we're going to introduce `Channels` and then add a mechanism so the page is set to 1 after an input event automatically.


<br>
Channels
===

<br>
> *Don't communicate by sharing state. Share state by communicating.*

<br>
*Prism* includes [Backbone.Radio](https://github.com/marionettejs/backbone.radio "") (an extension mantained by the [Marionette.js](http://marionettejs.com/ "") team) and introduces the `Prism.Channel` class, a class featuring a full messaging API that can be used to communicate state between components. This example shows the implementation of a component using a channel to synchronize their state.

<br>
```javascript
// file: ChannelComponent.jsx
import React from 'react';
import Prism from 'backbone.prism';
import EmitterComponent from './EmitterComponent.jsx';
import ListenerComponent from './ListenerComponent.jsx';

class ChannelComponent extends React.Component {
    componentWillMount() {
      this.channel = new Prism.Channel();
      this.channel.reply('initialize', { clicked: 0 });
    }
    
    componentWillUnmount() {
      this.channel.destroy();
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
Whenever a new state is applied, we communicate it to the listener component. In this case we use the `trigger` method to send the amount of clicks registered.


<br>
```javascript
// file: EmitterComponent.jsx
import React from 'react';

class EmitterComponent extends React.Component {
    constructor(props) {
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
The listener component defines a receiver callback using the `on` method. Notice that we're also using `request` and `reply` to initialize both components.

<br>
```javascript
// file: ListenerComponent.jsx
import React from 'react';

class ListenerComponent extends React.Component {
    constructor(props) {
      super(props);
      this.state = this.props.channel.request('initialize');
    }
    
    componentDidMount() {
      var self = this;
      this.props.channel.on('update:clicked', clicked => {
        self.setState({clicked});
      });
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
Communicating between components
====

<br>
Let's go back to our demo app. We're goig to add a channel to the main component so both the pagination component and the filter can communicate efficiently.

<br>
```javascript
// file: DemoApp.jsx
import React from 'react';
import store from './demostore';
import LandmarkList from './LandmarkList.jsx';
import ListOrderSelector from './ListOrderSelector.jsx';
import ListPaginationBar from './ListPaginationBar.jsx';
import ListFilter from './ListFilter.jsx';

class DemoApp extends React.Component {
  componentWillMount() {
    this.defaultView = store.createDefaultView();
    
    // Create paginated subview
    this.paginatedView = this.defaultView.createView({
      name: 'paginated',
      listenTo: 'sync'
    });
    
    // Create channel instance
    this.channel = new Prism.Channel();
  }
  
  componentDidMount() {
    store.publish();
  }
  
  componentWillUnmount() {
    this.defaultView.destroy();
  }
  
  render() {
    return (<div>
      <h3>Landmarks of the World</h3>
      <ListOrderSelector view={this.defaultView} />
      <ListFilter filterOn={this.defaultView} channel={this.channel} />
      <LandmarkList view={this.paginatedView} />
      <ListPaginationBar view={this.defaultView} paginateOn={this.paginatedView} channel={this.channel}/>
    </div>);
  }
}

export default DemoApp;
```

<br>
Every time the filter updates we trigger a `page:reset` event. We make the first modification in `ListFilter`.

<br>
```javascript
  componentWillMount() {
    // Initialize filter
    this.filter = this.props.filterOn.createFilter(this, () => {
      // Send a message to reset page
      this.props.channel.trigger('page:reset');
      
      let value = this.state.filter;
      let regex = new RegExp(value.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1"), 'i');
      return model => value === '' ? true : model.get('name').match(regex);
    });
    
    // Build a debounced callback to avoid any blocking behavior
    this.filterCallback = _.debounce(this.filter.eval(), 250);
  }
```

<br>
The `ListPaginationBar` component will listen to this event and update accordingly.

<br>
```javascript
  componentWillMount() {
    // Setup pagination
    this.paginator = this.props.paginateOn.createPaginator(this, this.props.pageSize, this.state.page);
    
    // Listen `page:reset` event
    this.props.channel.on('page:reset', () => {
      this.paginator.setPage(1);
      this.setState({page: 1}, this.paginator.eval());
    }, this);
  }
```

<br>
License
===

<br>
This library is distributed under the terms of the MIT license.

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
// File: dispatcher.js
import {Dispatcher} from 'backbone.prism';
export default new Dispatcher();
```

<br>
###Actions

<br>
It's time to define some *actions*. Let's start by building a simple store. As established by *Flux*, stores must register their actions through the dispatcher.

<br>
```javascript
// File: store.js
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
// File: actions.js
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

// Creates a view
let view = store.createView({
    name: 'main',           // Optional identifier
    comparator: 'priority'  // Default comparator
});

// Obtains a view by name
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
// File: TaskList.jsx
import React from 'react';
import Prism from 'backbone.prism';

class TaskList extends React.Component {
    render() {
        // Check if view is initialized
        if (!this.props.view.isInitialized()) {
			return (<p>Loading data...</p>);
		}
		
        // Obtain a JSON representation of the view
        let values = this.props.values();
        let view = values.view;
        
        // Render function
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
First things first: Our render method checks if a property named `view` is initialized. This ensures that the view instance is synchronized against the store. When false, we print a default *'Loading data'* message. In a real world application you might want to fetch some server data before doing stuff. This is a nice approach and prevents errors during initialization.<br>
If the view is correctly initialized a special method called `values` is injected in `props`. The object returned by this method is generated before the component is rendered and can contain different representations of the view instance.<br>
The *view* property available in *values* is a JSON representation of the entire view with some slight modifications. For example, notice that in the render function we're setting the *key* prop to the corresponding model *cid*. This property is added to each element when exported from a view. Finally, we use the `map` method to apply our render function to each one of the elements in the view.<br>
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
// File: main.js
import React from 'react';
import TaskList from './TaskList.jsx';
import store from './store';

// Create a default view
let storeView = store.getDefaultView();

// Render list
React.render(<TaskList view={storeView} />, document.getElementById('app'));

// Initialize all views
store.start();
```

<br>
The `start` method tells all views that the store is ready and they're able to sync their data. This is pretty useful because it allows the developer to only initialize components when data is available.

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
// File: TaskForm.jsx
import React from 'react';
import TaskActions from './actions';

class TaskForm extends React.Component {
    constructor(props) {
        super(props);
        
        // Set initial state
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

        // Add task
        TaskActions.addTask(task);
        
        // Reset state
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
// File: TasksApp.jsx
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
Until now we've seen that the value imported from the higher-order component consist in a single object containing a *view* property with the corresponding JSON representation of a store. In order to tell the component which property must be exported, we need to implement a `transform` method. This method receives a view instance and returns an object containing the values that are then sent to the component. The next example introduces the `TaskCounter` component, a component that will show the amount of tasks in the list.

<br>
```javascript
// File: TaskCounter.jsx
import React from 'react';
import Prism from 'backbone.prism';

class TaskCounter extends React.Component {
    transform(view) {
        return {
            total: view.length
        };
    }
    
    render() {
        if (!this.props.view.isInitialized()) {
            return (<div>Loading data...</div>);
        }
        
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
// File: TasksApp.jsx
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
Mutators are objects that define how a view is generated from a store instance. They allow to change a view configuration during runtime. A store view supports the following options:

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
Mutators are generated within components through the `createMutator` method. This method expects a callback and a context variable. The callback is executed using the context provided (the component itself) and must return a list of options that are later merged into the view. For our first example we'll implement the `TaskPaginator` component. This component will provide a pagination mechanism for our task list.

<br>
```javascript
// File: TaskPaginator.jsx
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
        // Pagination mutator
        this.paginator = this.props.target.createMutator(() => {
            let page = this.state.page;
            let pageSize = this.props.pageSize;
            
            return {
                offset: pageSize * (page - 1),
                size: pageSize
            };
        }, this);
    }
    
    componentWillUnmount() {
        // Destroy mutator when unmounted
        this.paginator.destroy();
    }
    
    handlePageClick(e) {
        e.preventDefault();

        // Update state and evaluate mutator
        this.setState({page: +e.target.innerHTML}, (() => this.paginator.apply()).bind(this));
    }
    
    render() {
        if (!this.props.view.isInitialized()) {
            return (<div></div>);
        }
        
        if (this.props.view.length <= this.props.pageSize) {
            return (
                <div>
                    <span>1</span>
                </div>
            );
        }
        
        // Get amount of pages
        let pages = Math.ceil(this.props.view.length / this.props.pageSize);
        
        // Render function
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
The `TaskPaginator` component starts by defining its initial state. The only required value is the current page number. Then it proceeds to initialize a mutator instance by providing a function that returns the options to update. This component receives 2 views: A main view, which is required to know how many pages are available; and the *target* view, which is the one that is associated with the mutator. Pagination components are a good example of elements that listen to a view and affect others.<br>

<br>
![Backbone.Prism](http://drive.google.com/uc?export=view&id=0B3PWnBYHw7RQWVVpZmtvTV8xWDA)

<br>
When rendering the element, we again check if the view is initialized correctly. We calculate the amount of pages and define a render function. Finally, we use the `times` helper function to render a link for each page.<br>
Each time the user clicks on a page link the component updates its state and then executes a function that applies the mutator. The associated callback is executed and the newly generated object configuration is then merged. An `apply` event is triggered which updates the *target* view contents. The view then triggers a `sync` event that makes all components listening to re-render.<br>
We can now include this component in the `TaskApp` class.

<br>
```javascript
// File: TasksApp.jsx
import React from 'react';
import store from './store';
import TaskList from './TaskList.jsx';
import TaskCounter from './TaskCounter.jsx';
import TaskForm from './TaskForm.jsx';
import TaskPaginator from './TaskPaginator.jsx';

class TasksApp extends React.Component {
    componentWillMount() {
        this.mainView = store.createView({
            name: 'main'
        });
        
        this.paginatedView = this.mainView.createView({
            name: 'paginated',
            listenTo: 'sync'
        });
    }
    
    render() {
        return (
            <div>
                <TaskList view={this.paginatedView} />
                <TaskPaginator view={this.mainView} target={this.paginatedView} pageSize={3}/>
                <TaskCounter view={store.getDefaultView()} />
                <TaskForm />
            </div>
        );
    }
}

export default TasksApp;
```

<br>
As explained before, now our app needs to manage 2 views. The *paginatedView* property is in fact a **subview**; that is, a child view created from a view instance. Notice that we're specifying the *listenTo* option to *'sync'*. Subviews must listen fo this specific event or else they won't update accordingly.

<br>
### Comparators

<br>
In order to introduce this topic we'll implement the `TaskOrderPicker` component. This component will be able to set how our task list is ordered.

<br>
```javascript
// File: OrderPicker.jsx
import React from 'react';
import Prism from 'backbone.prism'

class TaskOrderPicker extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			field: 'title',
			desc: false
		};
	}
	
	componentWillMount() {
	    // Comparator mutator
		this.comparator = this.props.target.createComparator(() => {
			let desc = this.state.desc;
			let field = this.state.field;
			
			return (model1, model2) => {
				return desc ? model1.get(field) < model2.get(field) : model1.get(field) > model2.get(field);
			};
		}, this);
	}
	
    componentWillUnmount() {
        // Destroy mutator when unmounted
        this.comparator.destroy();
    }
    
	handleInvertOrderClick(e) {
		e.preventDefault();
		let desc = !this.state.desc;
		this.comparator.update({desc});
	}
	
	handleFieldChangeSelect(e) {
		let field = e.target[e.target.selectedIndex].value;
		this.comparator.update({field});
	}
	
	render() {
		return (
			<div>
				<button onClick={this.handleInvertOrderClick.bind(this)}>Invert order</button>
				<br/>
				Order by: <select onChange={this.handleFieldChangeSelect.bind(this)} defaultValue={this.state.field}>
					<option value={'priority'}>Priority</option>
					<option value={'title'}>Title</option>
				</select>
			</div>
		);
	}
}

export default TaskOrderPicker;
```
<br>
Comparators are created through the `createComparator` method. This method expects a function returning a string or a comparator function plus a context variable. This component renders a form from which we can select the order column and invert the order as well. Finally, we update the `TaskApp` class to include our newly created component.

<br>
```javascript
// File: TasksApp.jsx
import React from 'react';
import store from './store';
import TaskList from './TaskList.jsx';
import TaskCounter from './TaskCounter.jsx';
import TaskForm from './TaskForm.jsx';
import TaskPaginator from './TaskPaginator.jsx';
import TaskOrderPicker from './TaskOrderPicker.jsx';

class TasksApp extends React.Component {
    componentWillMount() {
        this.mainView = store.createView({
            name: 'main'
        });
        
        this.paginatedView = this.mainView.createView({
            name: 'paginated',
            listenTo: 'sync'
        });
    }
    
    render() {
        return (
            <div>
                <TaskList view={this.paginatedView} />
                <TaskPaginator view={this.mainView} target={this.paginatedView} pageSize={3}/>
                <TaskOrderPicker target={this.mainView} />
                <TaskCounter view={store.getDefaultView()} />
                <TaskForm />
            </div>
        );
    }
}

export default TasksApp;
```
<br>
This time the component must receive the *mainView* property as its target. When a view is updated then all subviews listening will also update.

<br>
### Channels

<br>
> *Don't communicate by sharing state. Share state by communicating.*

<br>
*Prism* includes [Backbone.Radio](https://github.com/marionettejs/backbone.radio "") (an extension mantained by the [Marionette.js](http://marionettejs.com/ "") team) and introduces the `Prism.Channel` class, a class featuring a full messaging API that can be used to communicate state between components. This example shows the implementation of a component using a channel to synchronize their state.

<br>
```javascript
// File: ChannelComponent.jsx
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
// File: EmitterComponent.jsx
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
// File: ListenerComponent.jsx
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
###Filters

<br>
Before introducing filters we'll make a few changes to our main component. First, we're going to rename *mainView* to *filteredView*. This view is going to be associated with the filter mutator. We're also adding a custom channel instance to communicate events to our pagination component.

<br>
```javascript
// File: TasksApp.jsx
import React from 'react';
import {Channel} from 'backbone.prism';
import store from './store';
import TaskList from './TaskList.jsx';
import TaskCounter from './TaskCounter.jsx';
import TaskForm from './TaskForm.jsx';
import TaskPaginator from './TaskPaginator.jsx';
import TaskOrderPicker from './TaskOrderPicker.jsx';

class TasksApp extends React.Component {
    componentWillMount() {
        this.filteredView = store.createView({
            name: 'filtered'
        });
        
        this.paginatedView = this.filteredView.createView({
            name: 'paginated',
            listenTo: 'sync'
        });
        
        this.resetChannel = new Channel();
    }
    
    render() {
        return (
            <div>
                <TaskList view={this.paginatedView} />
                <TaskPaginator view={this.filteredView} target={this.paginatedView} channel={this.channel} pageSize={3}/>
                <TaskOrderPicker target={this.filteredView} />
                <TaskCounter view={store.getDefaultView()} />
                <TaskForm />
            </div>
        );
    }
}

export default TasksApp;
```

<br>
In order to our filter to work correctly we need to implement a mechanism to reset the current page. That means changing the state in the `TaskPaginator` component. We'll define a `page:reset` event listener so that the filter component can reset the current page.

<br>
```javascript
// File: TaskPaginator.jsx
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
        // Pagination mutator
        this.paginator = this.props.target.createMutator(() => {
            let page = this.state.page;
            let pageSize = this.props.pageSize;
            
            return {
                offset: pageSize * (page - 1),
                size: pageSize
            };
        }, this);
        
        // Pagination callback
        this.paginatorCallback = (() => this.paginator.apply()).bind(this);

        // Reset page on event        
        this.props.channel.on('page:reset', (() => {
            // Update state silently
			this.paginator.update({page: 1}, true);
        }).bind(this));
    }
    
    componentWillUnmount() {
        // Destroy mutator when unmounted
        this.paginator.destroy();
    }
    
    handlePageClick(e) {
        e.preventDefault();

        // Update state and evaluate mutator
        this.setState({page: +e.target.innerHTML}, this.paginatorCallback);
    }
    
    totalPages(items, pageSize) {
        return Math.ceil(items / pageSize);
    }
    
    componentWillReceiveProps(nextProps) {
		let values = nextProps.values();
		let pages = this.totalPages(values.view.length, this.props.pageSize);
		
		// Check if paginator is out of bounds
		if (this.state.page > pages) {
			this.setState({ page: pages }, this.paginatorCallback);
		}
	}

    render() {
        if (!this.props.view.isInitialized()) {
            return (<div></div>);
        }
        
        if (this.props.view.length <= this.props.pageSize) {
            return (
                <div>
                    <span>1</span>
                </div>
            );
        }
        
        // Get amount of pages
        let pages = this.totalPages(this.props.view.length, this.props.pageSize);
        
        // Render function
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
We've added a few things here. First, we've added a `totalPages` method and a `paginatorCallback` property. The component also starts listening for the `page:reset` event. Each time this event is triggered we need to update the component state, but we need to do it in  a way that doesn't interfere with other updates in the background. The `update` method, available in all mutators, merges a state object in the current component state and then applies the mutator itself. Here we're telling the mutator to not to trigger an `apply` event by providing an additional *true* argument, making it silent. This is necessary because the `TaskFilter` component will be responsible of updating the related view. We've also included a `componentWillReceiveProps`. This method will update the amount of pages that are shown. This is important to avoid weird behaviour when an element is removed from the list.

<br>
```javascript
// File: TaskFilter.jsx
import React from 'react';
import Prism from 'backbone.prism';
import Underscore from 'underscore';

class TaskFilter extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			text: ''
		};
	}
	
	componentWillMount() {
	    // Define view filter
		this.filter = this.props.target.createFilter((model) => {
			let text = this.state.text;
			let regex = new RegExp(text.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1"), 'i');

            return model => text === '' ? true : model.get('title').match(regex);
		}, this);
		
		this.channel = this.props.channel;
		
        // Define a filter callback
		this.filterCallback = Underscore.debounce((() => this.filter.apply()).bind(this), 200);
	}
	
    componentWillUnmount() {
        this.filter.destroy();
    }
	
	handleFilterChange(e) {
		let text = e.target.value;
		
        // Reset page without triggering an update
		this.channel.trigger('page:reset');
		
        // Update state and apply filter appropiately
		this.setState({text}, this.filterCallback); 
	}
	
	render() {
		return (
			<input type="text" value={this.state.text} onChange={this.handleFilterChange.bind(this)} />
		);
	}
}

export default TaskFilter;
```

<br>
Filters, are created through the *createFilter* method. The associated callback must return a function receiving a single model as argument. In this case we defined a filter that checks if the text introduced is included in the model *title* attribute. We're also generating a filter callback using the `debounce` method available in *Underscore.js*. This method is responsible of applying the filter once the new state is set.<br>
Or final app will look like this:

<br>
```javascript
// File: TasksApp.jsx
import React from 'react';
import {Channel} from 'backbone.prism';
import store from './store';
import TaskList from './TaskList.jsx';
import TaskCounter from './TaskCounter.jsx';
import TaskForm from './TaskForm.jsx';
import TaskPaginator from './TaskPaginator.jsx';
import TaskOrderPicker from './TaskOrderPicker.jsx';
import TaskFilter from './TaskFilter.jsx';

class TasksApp extends React.Component {
    componentWillMount() {
        this.filteredView = store.createView({
            name: 'filtered'
        });
        
        this.paginatedView = this.filteredView.createView({
            name: 'paginated',
            listenTo: 'sync'
        });
        
        this.resetChannel = new Channel();
    }
    
    render() {
        return (
            <div>
                <TaskFilter target={this.filteredView} channel={this.channel} />
                <TaskList view={this.paginatedView} />
                <TaskPaginator view={this.filteredView} target={this.paginatedView} channel={this.channel} pageSize={3}/>
                <TaskOrderPicker target={this.filteredView} />
                <TaskCounter view={store.getDefaultView()} />
                <TaskForm />
            </div>
        );
    }
}

export default TasksApp;
```


<br>
###Demos

<br/>
 * Backbone-Prism-Todos: The classic Todo app made with Backbone.Prism ([Link](https://backbone-prism-todos.herokuapp.com "")).

<br>
###License

<br>
This library is distributed under the terms of the MIT license.
