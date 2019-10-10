# Backbone.Prism

[![Build Status](https://travis-ci.org/emaphp/backbone.prism.svg?branch=master)](https://travis-ci.org/emaphp/backbone.prism)

Flux architecture for Backbone.js

## About

Backbone.Prism features a [Flux](https://facebook.github.io/flux/ "") based architecture combining [Backbone.js](http://backbonejs.org/ "") and [React](https://facebook.github.io/react/ "").

## Demo

([Backbone-Prism-Todos](https://backbone-prism-todos.herokuapp.com "")): A classic Todo app featuring filters, sorting and pagination, done in Backbone.Prism.

## Installation

```
npm install backbone.prism --save
```

## Introduction

Backbone.Prism is a Backbone.js library that features a set of classes and utilities for implementing applications using the `Flux` architecture. This library includes:

 * A `Store` and a `State` class, based on `Backbone.Collection` and `Backbone.Model` respectively.
 * A `Dispatcher` class based on `Flux.Dispatcher`.
 * A `StoreView` and a `StateView` class, both defining an interface for `viewable models`.
 * An utility function for generating *Higher-Order Components* in `React`.
 * A `Channel` class for allowing communication between components.

### Viewable Models

Prism introduces the concept of `viewable model`. A `Store` instance, for example, is a viewable collection, meaning that it can have many `store views` associated. These `model views` represent a particular set of data present in a model and the way it should be rendered. The concept is pretty similar to the one found in RDBMS, where a `view` is a result set returned by a query.

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

When a `Store` instance calls the `publish` method, all `store views` will start listening for changes. Any element added/removed/modified on the store will trigger a sync routine.

```javascript
// Adding an element to a store will trigger an event
store.add({
  name: 'Arc de Triomphe',
  location: 'France'
});

// Views will listen for these types of event and sync their data again
console.log(view.length); // prints '3'
```

The real advantage of using `model views` is that they can also hold a list of options describing how a model should be rendered. Before showing how this process works, lets first introduce the concept of `Higher-Order Component`. This section assumes you are familiar with `React` and how to render a `React Component`.

### Higher-Order Components

The idea behind using `Higher-Order Components` is replacing the use of mixins by wrapping a user-defined component into another. This wrapping component is generated through a function that takes a component class and returns a wrapper. That way, instead of using mixins that end up cluttering our component, we manage a particular logic in the wrapper component and let it decide how its child component should be rendered.
A full explanation of how `Higher-Order Components` really work would take a lot of space. If you want to now more about **Higher-Order Components** check out this [post](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750 "") written by Dan Abramov.

Prism generates this type of component through the `compose` function. This function takes a component class and a list of props that will contain `model views`. The resulting component will listen for changes in the specified props. When a change is detected the component will re-render.

```javascript
// file: MyComponent.js
import React from 'react';
import Prism from 'backbone.prism';

class MyComponent extends React.Component {
  // ...
}

// Builds a wrapping component listening to the 'view' prop
export default Prism.compose(MyComponent, ['view']);
```

This simplifies the process of binding a component to a view. In order to use this component we need to provide a valid `model view` as the `view` prop.

```javascript
// file: MainComponent.js
import React from 'react';
import store from './store';
import MyComponent from './MyComponent.js';

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

The next section illustrates this concept by building a simple list app.

## Demo app

This app will show a list of landmarks using a `Store` and two `React` components. Lets create the list of landmarks using a simple `Store`:

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

The first component will represent the app itself. It will be responsible of generating a default view for the list component.

```javascript
// file: DemoApp.js
import React from 'react';
import store from './demostore';
import LandmarkList from './LandmarkList.js';

class DemoApp extends React.Component {
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
      <h3>Landmarks of the World</h3>
      <LandmarkList view={this.defaultView} />
    </div>);
  }
}

export default DemoApp;
```

The `LandmarkList` component needs to listen to the `view` prop. Any change in that prop (or its parent store) should trigger a re-render.

```javascript
// file: LandmarkList.js
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

Finally, we render our app using `react-dom`.

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import DemoApp from './DemoApp.js';

ReactDOM.render(<DemoApp />, document.getElementById('app'));
```

This application must be bundled using Browserify or Webpack combined with Babel. For the sake of brevity we're going to omit this step.

### Improving initialization

In a real world application you might have to fetch data from the server, meaning that the component will be rendered before any data is ready. We can check if a given view is properly initialized with the `isInitialized` method. That way we can provide a meaningful message to alert that no data is available at the moment.

```javascript
// file: LandmarkList.js
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

We can simulate this process by delaying the call to `publish` in the main component.

```javascript
  componentDidMount() {
    setTimeout(() => store.publish(), 3000);
  }
```

Now the component will show a little message before rendering the list.

### Working with views

The simplest way of creating a view is through the `getDefaultView` method.

```javascript
import store from './store';

let view = store.getDefaultView();
view.name === 'default'; // true
```

Both this method and `createView` accept an object containing a set of options. This object can contain the following properties:

 * name: A name that identifies this view. You can obtain a view by name through the `getView` method.
 * comparator: A function or property name used to sort the collection.
 * filter: A function used for filtering models in a collection.
 * size: The amount of elements to hold.
 * offset: The amount of elements to omit from the beginning.
 
### View configuration

Views provide an easy mechanism for changing configuration options through `configs`. A `ViewConfig` object sets a particular list of options in a view and then notifies the view through an event (the `set` event). The next example implements a component that defines the amount of elements to show on a list.

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

This component will store the amount of elements to show in a state var. We'll initialize the `ViewConfig` element in the `componentWillMount` method.

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

The `createConfig` method expects a context object, generally the component itself, and a configuration callback. This callback gets invoked after calling the `apply` method and uses the context provided during the initialization. The configuration object returned by this callback is then merged against the view configuration. We need to make sure we destroy the configuration object once the component is unmounted.

```javascript
  render() {
    let options = [3, 5, 10];
    let render = value => {
      return (<option key={value} value={value}>{value}</option>);
    };
    
    return (<select value={this.state.size} onChange={this.onOptionChange.bind(this)}>{options.map(render)}</select>);
  }
```

The handler gets the selected value and updates the component state. We provide an additional callback that updates the view.

```javascript
  onOptionChange(e) {
    let self = this;
    let value = +e.target.value;
    this.setState({size: value}, () => {
      self.config.apply();
    });
  }
```

A more elegant version of the above could be achieved using the `eval` method. This methods returns a callback that applies the new configuration.

```javascript
  onOptionChange(e) {
    let value = +e.target.value;
    this.setState({size: value}, this.config.eval());
  }
```

Once the configuration is applied the view triggers an event that notifies all listening components that a change has been made.

## Comparators

A comparator simply applies a sort algorithm to a collection. This is done by calling the `createComparator` method and specifying a callback that returns either a field name or a sorting function.

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

## Paginators

Paginators offers a simple way of separating a big list of elements into smaller sets. We begin by calling the `createPaginator` method passing the component instance, the page size and the initial page. Once done, we simply update the page number through `setPage` and apply the new configuration. Keep in mind that pagination components still need to listen for changes in the view that contains the elements we want to paginate. These kind of components are an example of components that listen to a view but apply modifications to another.

```javascript
// file: ListPaginator.js
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

Now we need to update the way views are managed in the main component. We add a new paginated view that will listen for changes in the default view. Notice that this view will need to listen for a different type of event (`sync`). These types of view are called `subviews`.

```javascript
// file: DemoApp.js
import React from 'react';
import store from './demostore';
import LandmarkList from './LandmarkList.js';
import ListOrderSelector from './ListOrderSelector.js';
import ListPaginationBar from './ListPaginationBar.js';

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

## Filters

Filters are pretty straightforward. This time we invoke the `createFilter` method passing a context object and a callback. Callbacks can return either a filter function or an object setting a specific criteria. This example sets a filter combining regex matching and the [debounce](http://underscorejs.org/#debounce) function utility.

```javascript
// file: ListFilter.js
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

But now our app has a flaw. If you navigate to the last page and then input a letter in our newly created filter we obtain an empty list. This is because the view is still using the offset applied through the pagination component. What we obtain is an `out of bounds view`. To solve this issue we're going to introduce `Channels` and then add a mechanism so the page is set to 1 after an input event.


## Channels

> *Don't communicate by sharing state. Share state by communicating.*

*Prism* includes [Backbone.Radio](https://github.com/marionettejs/backbone.radio "") (an extension mantained by the [Marionette.js](http://marionettejs.com/ "") team) and introduces the `Prism.Channel` class, a class featuring a full messaging API that can be used to communicate state between components. This example shows the implementation of a component using a channel to synchronize their state.

```javascript
// file: ChannelComponent.js
import React from 'react';
import Prism from 'backbone.prism';
import EmitterComponent from './EmitterComponent.js';
import ListenerComponent from './ListenerComponent.js';

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

Whenever a new state is applied, we communicate it to the listener component. In this case we use the `trigger` method to send the amount of clicks registered.


```javascript
// file: EmitterComponent.js
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

The listener component defines a receiver callback using the `on` method. Notice that we're also using `request` and `reply` to initialize both components.

```javascript
// file: ListenerComponent.js
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

### Communicating between components

Let's go back to our demo app. We're goig to add a channel to the main component so both the pagination component and the filter can communicate efficiently.

```javascript
// file: DemoApp.js
import React from 'react';
import store from './demostore';
import LandmarkList from './LandmarkList.js';
import ListOrderSelector from './ListOrderSelector.js';
import ListPaginationBar from './ListPaginationBar.js';
import ListFilter from './ListFilter.js';

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

Every time the filter receives an input we trigger a `page:reset` event. We make the first modification in `ListFilter`.

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

The `ListPaginationBar` component will listen to this event and update accordingly.

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

## View event handlers

By default, classes generated with `Prism.compose` will force a re-render when the view updates. This is done by calling the `forceUpdate` method in the wrapping component. Prism offers an alternative mechanism: by defining some special methods in the wrapped component class we can execute a custom logic when a view is updated. Keep in mind that these methods are executed using the parent component as their context.

### viewUpdate

The `viewUpdate` method is called when something in the view changes. This method receives the view instance as an argument.

```javascript
  viewUpdate(view) {
    console.log('View' + view.name + 'update. Setting state...');
    
    // Set parent state vars to force re-render
    this.setState({lastUpdate: (new Date()).getTime()});
  }
```

In order to obtain a parent state var we'll use the `$value` method available in the props object.

```javascript
  render() {
    let lastUpdate = this.props.$value('lastUpdate');
    return (<small>Last update: {lastUpdate}</small>);
  }
```

### viewTransform

The `viewTransform` method provides a more straightforward way to set the component state. It must return an object containing the parent state vars, which are later merged in the wrapper component. Again, it will receive the view instance as its only argument.

```javascript
  viewTransform(view) {
    return {
      total: view.length
    };
  }
  
  render() {
    return (<em>Showing {this.props.$value('total')} records</em>);
  }
```

## Flux by example

### Stores

According to the designers of *Flux*, a store *"contains the application state and logic"*. This same approach is implemented through the `Prism.Store` class, which extends `Backbone.Collection`.

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

Alternatively, you could use the `Prism.State` class, a `viewable model` based on `Backbone.Model`.

```javascript
import {State} from 'backbone.prism';

let Profile = State.extend({
    url: '/profile'
});
```

### Dispatcher

The `Prism.Dispatcher` class doesn't add much to the original *Flux* dispatcher except for a few methods like `handleViewAction` and `handleServerAction`.

```javascript
// file: dispatcher.js
import {Dispatcher} from 'backbone.prism';
export default new Dispatcher();
```

Stores need to register their list of actions through the dispatcher. This example shows a simple approach for registering actions for a task store.

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

Finally, we define a simple interface for these actions.

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


## License

This library is distributed under the terms of the MIT license.
