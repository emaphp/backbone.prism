describe('Prism.StateView tests', function() {
    it('Should initialize', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([{name: 'Ralph', specie: 'dog'}, {name: 'Lucy', specie: 'cat'}]);
        var view = store.createView({
            name: 'test'
        });
        expect(view.parent).toBe(store);
        expect(view.name).toBe('test');
        expect(view._isInitialized).toBe(false);

        store.start();
        expect(view._isInitialized).toBe(true);
        expect(view.models).toBeDefined();
        expect(view.length).toBe(2);
        expect(store.at(0).get('name')).toBe('Ralph');
        expect(store.at(0).get('specie')).toBe('dog');
        expect(store.at(1).get('name')).toBe('Lucy');
        expect(store.at(1).get('specie')).toBe('cat');
    });

    it('Should trigger sync event', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([{name: 'Ralph', specie: 'dog'}, {name: 'Lucy', specie: 'cat'}]);
        var view = store.createView({
            name: 'test'
        });

        var listener = {
            callback: function () {
                return;
            }
        };

        spyOn(listener, 'callback');
        view.on('sync', listener.callback);
        store.start();
        expect(listener.callback).toHaveBeenCalled();
    });

    it('Should export cid', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([{name: 'Ralph', specie: 'dog'}, {name: 'Lucy', specie: 'cat'}]);
        var view = store.createView({
            name: 'test'
        });

        store.start();
        var values = view.toJSON();
        expect(values.length).toBe(2);
        expect(values[0].cid).toBeDefined();
        expect(values[0].cid).toMatch(/^c/);
        expect(values[0].name).toBe('Ralph');
        expect(values[0].specie).toBe('dog');
        expect(values[1].cid).toBeDefined();
        expect(values[1].cid).toMatch(/^c/);
        expect(values[1].name).toBe('Lucy');
        expect(values[1].specie).toBe('cat');
    });

    it('Should mutate options', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([{name: 'Ralph', specie: 'dog'}, {name: 'Lucy', specie: 'cat'}]);
        var view = store.createView({
            name: 'test',
            comparator: 'name',
            size: 10
        });
        var options = {size: 5};


        var listener = {
            callback: function () {
                return;
            }
        };

        spyOn(listener, 'callback');
        var mutator = view.createMutator(function () {
            return options;
        });
        mutator.on('apply', listener.callback);

        store.start();
        expect(listener.callback).not.toHaveBeenCalled(); // first update is silent
        expect(view.options.size).toBe(5);

        options = {size: 10, comparator: 'specie'};
        mutator.apply();
        expect(listener.callback).toHaveBeenCalled();
        expect(view.options.size).toBe(10);
        expect(view.options.comparator).toBe('specie');
        expect(view.models[0].get('name')).toBe('Lucy');
    });

    it('Should apply comparator', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([
            {name: 'Ralph', specie: 'dog', age: 3},
            {name: 'Lucy', specie: 'cat', age: 5},
            {name: 'Gex', specie: 'lizard', age: 9},
            {name: 'Ed', specie: 'horse', age: 7},
            {name: 'Tom', specie: 'echidna', age: 3},
            {name: 'Go', specie: 'gopher', age: 2},
            {name: 'Frank', specie: 'parrot', age: 5}
        ]);

        var customView = store.createView({
            comparator: 'age'
        });

        var defaultView = store.getDefaultView();

        var comparator = defaultView.createComparator(function () {
            return function (m1, m2) {
                return m2.get('name') < m1.get('name');
            };
        });

        store.start();
        expect(customView.models[0].get('name')).toBe('Go');
        expect(customView.models[6].get('name')).toBe('Gex');
        expect(defaultView.models[0].get('name')).toBe('Ed');
        expect(defaultView.models[6].get('name')).toBe('Tom');
    });

    it('Should apply filters', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([
            {name: 'Ralph', specie: 'dog', age: 3},
            {name: 'Lucy', specie: 'cat', age: 5},
            {name: 'Gex', specie: 'lizard', age: 9},
            {name: 'Ed', specie: 'horse', age: 7},
            {name: 'Tom', specie: 'echidna', age: 3},
            {name: 'Go', specie: 'gopher', age: 2},
            {name: 'Frank', specie: 'parrot', age: 5}
        ]);

        var youngestView = store.createView({
            filter: function (pet) {
                return pet.get('age') < 7;
            }
        });

        var exactAgeView = store.createView({
            filter: {age: 5}
        });

        var defaultView = store.getDefaultView();

        var nameFilter = defaultView.createFilter(function () {
            return function (model) {
                return model.get('specie').match(/o/);
            };
        });

        var ageFilter = defaultView.createFilter(function () {
            return function (model) {
                return model.get('age') >=5;
            };
        });

        store.start();

        expect(youngestView.models.length).toBe(5);
        expect(exactAgeView.models.length).toBe(2);
        expect(defaultView.models.length).toBe(2);
    });

    it('Should ignore event', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([{name: 'Ralph', specie: 'dog'}, {name: 'Lucy', specie: 'cat'}]);
        var view = store.createView({
            name: 'test'
        });

        var listener = {
            callback: function () {
            }
        };

        spyOn(listener, 'callback');
        view.on('sync', listener.callback);
        store.start();
        expect(listener.callback).toHaveBeenCalled();
        expect(listener.callback.calls.count()).toBe(1);
        store.add({name: 'Gex', specie: 'lizard'});
        expect(listener.callback.calls.count()).toBe(2);
        view.sleep();
        store.add({name: 'Ed', specie: 'horse'});
        expect(listener.callback.calls.count()).toBe(2);
        expect(view.models.length).toBe(3);
        view.wakeup();
        expect(listener.callback.calls.count()).toBe(3);
        expect(view.models.length).toBe(4);
    });
    
    it('Should return subview instance', function () {
		var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([{name: 'Ralph', specie: 'dog'}, {name: 'Lucy', specie: 'cat'}]);
        var view = store.createView({
            name: 'test'
        });
        var subview = view.createView({
			name: 'subview'
		});
		
		expect(subview.parent).toBe(view);
		expect(view.views['subview']).toBe(subview);
	});
	
	it('Should update subview', function () {
		var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([{name: 'Ralph', specie: 'dog'}, {name: 'Lucy', specie: 'cat'}]);
        var view = store.createView({
            name: 'test'
        });
        var subview = view.createView({
			name: 'subview',
			listenTo: 'sync'
		});
		
		store.start();
		expect(view.length).toBe(2);
		expect(subview.length).toBe(2);
		
		store.add({name: 'Truman', specie: 'parrot'});
		expect(store.length).toBe(3);
		expect(view.length).toBe(3);
		expect(subview.length).toBe(3);
	});
	
	it('Should apply view mutators', function () {
		var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([
			{name: 'Ralph', specie: 'dog', age: 3},
            {name: 'Lucy', specie: 'cat', age: 5},
            {name: 'Gex', specie: 'lizard', age: 9},
            {name: 'Ed', specie: 'horse', age: 7},
            {name: 'Tom', specie: 'echidna', age: 3},
            {name: 'Go', specie: 'gopher', age: 2},
            {name: 'Frank', specie: 'parrot', age: 5}
        ]);
        var view = store.createView({
            name: 'test'
        });
        var subview = view.createView({
			name: 'subview',
			listenTo: 'sync'
		});
		
		var obj = {
			mutatorCallback: function () {
				return {
					offset: 1,
					size: 4
				};
			}
		};
		
		var viewMutator = view.createMutator(obj.mutatorCallback, null);
		
		//
		var subViewMutator = subview.createMutator(function () {
			return {
				size: 3
			};
		}, null);
		
		var subViewComparator = subview.createComparator(function () {
			return function (model1, model2) {
				return model1.get('age') < model2.get('age');
			};
		}, null);
		
		expect(view.mutators[viewMutator.cid]).toBe(viewMutator);
		store.start();
		expect(view.length).toBe(4);
		expect(subview.length).toBe(3);
		expect(subview.models[0].get('name')).toBe('Gex');
	});
});
