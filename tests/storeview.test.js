describe('Prism.StateView tests', function() {
    it('Should initialize its subviews', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([{name: 'Ralph', specie: 'dog'}, {name: 'Lucy', specie: 'cat'}]);
        var view = store.createView({
            name: 'test'
        });
        expect(view.parent).to.equal(store);
        expect(view.name).to.equal('test');
        expect(view._isInitialized).to.be.false;

        store.publish();
        expect(view._isInitialized).to.be.true;
        expect(view.models).to.exist;
        expect(view.length).to.equal(2);
        expect(store.at(0).get('name')).to.equal('Ralph');
        expect(store.at(0).get('specie')).to.equal('dog');
        expect(store.at(1).get('name')).to.equal('Lucy');
        expect(store.at(1).get('specie')).to.equal('cat');
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

        var spy = sinon.spy(listener, 'callback');
        view.on('sync', listener.callback);
        store.publish();
        expect(spy.called).to.be.true;
    });

    it('Should export cid', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([{name: 'Ralph', specie: 'dog'}, {name: 'Lucy', specie: 'cat'}]);
        var view = store.createView({
            name: 'test'
        });

        store.publish();
        var values = view.toJSON();
        expect(values.length).to.equal(2);
        expect(values[0].cid).to.exist;
        expect(values[0].cid).to.match(/^c/);
        expect(values[0].name).to.equal('Ralph');
        expect(values[0].specie).to.equal('dog');
        expect(values[1].cid).to.exist;
        expect(values[1].cid).to.match(/^c/);
        expect(values[1].name).to.equal('Lucy');
        expect(values[1].specie).to.equal('cat');
    });

    it('Should modify options', function () {
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

        var spy = sinon.spy(listener, 'callback');
        var config = view.createConfig(null, function () {
            return options;
        });
        config.on('set', listener.callback);

        store.publish();
        expect(spy.called).to.be.false; // first update is silent
        expect(view.options.size).to.equal(5);

        options = {size: 10, comparator: 'specie'};
        config.apply();
        expect(spy.called).to.be.true;
        expect(view.options.size).to.equal(10);
        expect(view.options.comparator).to.equal('specie');
        expect(view.models[0].get('name')).to.equal('Lucy');
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

        var comparator = defaultView.createComparator(null, function () {
            return function (m1, m2) {
                return m2.get('name') < m1.get('name') ? 1 : (m2.get('name') > m1.get('name') ? -1 : 0);
            };
        });

        store.publish();
        expect(customView.models[0].get('name')).to.equal('Go');
        expect(customView.models[6].get('name')).to.equal('Gex');
        expect(defaultView.models[0].get('name')).to.equal('Ed');
        expect(defaultView.models[6].get('name')).to.equal('Tom');
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

        var nameFilter = defaultView.createFilter(null, function () {
            return function (model) {
                return model.get('specie').match(/o/);
            };
        });

        var ageFilter = defaultView.createFilter(null, function () {
            return function (model) {
                return model.get('age') >=5;
            };
        });

        store.publish();

        expect(youngestView.models.length).to.equal(5);
        expect(exactAgeView.models.length).to.equal(2);
        expect(defaultView.models.length).to.equal(2);
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

        var spy = sinon.spy(listener, 'callback');
        view.on('sync', listener.callback);

        store.publish();
        expect(spy.called).to.be.true;
        expect(spy.calledOnce).to.be.true;
        expect(view.models.length).to.equal(2);

        store.add({name: 'Gex', specie: 'lizard'});
        expect(spy.calledTwice).to.be.true;
        expect(view.models.length).to.equal(3);

        view.sleep();

        store.add({name: 'Ed', specie: 'horse'});
        expect(spy.calledThrice).to.be.false,
        expect(view.models.length).to.equal(3);

        view.wakeup(true);
        expect(spy.calledThrice).to.be.true;
        expect(view.models.length).to.equal(4);
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

        expect(subview.parent).to.equal(view);
        expect(view.views['subview']).to.equal(subview);
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

        store.publish();
        expect(view.length).to.equal(2);
        expect(subview.length).to.equal(2);

        store.add({name: 'Truman', specie: 'parrot'});
        expect(store.length).to.equal(3);
        expect(view.length).to.equal(3);
        expect(subview.length).to.equal(3);
    });

    it('Should apply view configs', function () {
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
            configCallback: function () {
                return {
                    offset: 1,
                    size: 4
                };
            }
        };

        var viewConfig = view.createConfig(null, obj.configCallback);

		    var subViewConfig = subview.createConfig(null, function () {
            return {
                size: 3
			      };
		    });

        var subViewComparator = subview.createComparator(null, function () {
			      return function (model1, model2) {
				        return model1.get('age') < model2.get('age') ? 1 : (model1.get('age') > model2.get('age') ? -1 : 0);
			      };
		    });

		    expect(view.configs[viewConfig.cid]).to.equal(viewConfig);
		    store.publish();
		    expect(view.length).to.equal(4);
		    expect(subview.length).to.equal(3);
		    expect(subview.models[0].get('name')).to.equal('Gex');
	  });

    it('Should paginate view', function () {
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

        var paginator = view.createPaginator(null, 3, 2);
        paginator.apply();
        store.publish();
        expect(view.length).to.equal(3);
        expect(paginator.getTotalPages(store.length)).to.equal(3);
        expect(view.models[0].get('name')).to.equal('Ed');

        paginator.setCurrentPage(1, true);
        expect(paginator.page).to.equal(1);
        expect(view.length).to.equal(3);
        expect(view.models[0].get('name')).to.equal('Ralph');

        paginator.setCurrentPage(3, false);
        expect(paginator.page).to.equal(3);
        expect(view.length).to.equal(3);
        paginator.apply();
        expect(view.length).to.equal(1);
        expect(view.models[0].get('name')).to.equal('Frank');
    });
});
