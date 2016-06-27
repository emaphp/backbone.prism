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

    it('Should implement collection methods', function () {
        var Store = Backbone.Prism.Store.extend({
            name: 'store'
        });

        var store = new Store([
            {name: 'Ralph', specie: 'dog', age: 3},
            {name: 'Lucy', specie: 'cat', age: 5},
            {name: 'Ed', specie: 'horse', age: 7},
            {name: 'Go', specie: 'gopher', age: 2}
        ]);
        var view = store.createView({
            name: 'test'
        });
        store.publish();

        // forEach
        expect(view.forEach).to.exists;
        expect(typeof view.forEach).to.equal('function');
        var result = [];
        view.forEach(function(model) {
            result.push(model.get('name'));
        });
        expect(result.length).to.equal(4);
        expect(result[0]).to.equal('Ralph');
        expect(result[1]).to.equal('Lucy');
        expect(result[2]).to.equal('Ed');
        expect(result[3]).to.equal('Go');

        // each
        expect(view.each).to.exists;
        expect(typeof view.each).to.equal('function');
        var eachCallback = sinon.spy();
        view.each(eachCallback);
        expect(eachCallback.callCount).to.equal(4);
        expect(eachCallback.getCall(0).args[0]).to.equal(view.models[0]);
        expect(eachCallback.getCall(1).args[0]).to.equal(view.models[1]);
        expect(eachCallback.getCall(2).args[0]).to.equal(view.models[2]);
        expect(eachCallback.getCall(3).args[0]).to.equal(view.models[3]);

        // map
        expect(view.map).to.exists;
        expect(typeof view.map).to.equal('function');
        var object = { method: function (model) { return model.get('name') } };
        var mapCallback = sinon.spy(object,  'method');
        var result = view.map(mapCallback);
        expect(mapCallback.callCount).to.equal(4);
        expect(result.length).to.equal(4);
        expect(result[0]).to.equal('Ralph');
        expect(result[1]).to.equal('Lucy');
        expect(result[2]).to.equal('Ed');
        expect(result[3]).to.equal('Go');

        // collect
        expect(view.collect).to.exists;
        expect(typeof view.collect).to.equal('function');
        var object = { method: function (model) { return model.get('name') } };
        var collectCallback = sinon.spy(object,  'method');
        var result = view.collect(collectCallback);
        expect(collectCallback.callCount).to.equal(4);
        expect(result.length).to.equal(4);
        expect(result[0]).to.equal('Ralph');
        expect(result[1]).to.equal('Lucy');
        expect(result[2]).to.equal('Ed');
        expect(result[3]).to.equal('Go');

        // reduce
        expect(view.reduce).to.exists;
        expect(typeof view.reduce).to.equal('function');
        var object = { method: function (memo, model) { return memo + model.get('name'); }};
        var reduceCallback = sinon.spy(object, 'method');
        var result = view.reduce(reduceCallback, '');
        expect(reduceCallback.callCount).to.equal(4);
        expect(result).to.equal('RalphLucyEdGo');

        // foldl (alias of reduce)
        expect(view.foldl).to.exists;
        expect(typeof view.foldl).to.equal('function');
        var object = { method: function (memo, model) { return memo + model.get('name'); }};
        var foldlCallback = sinon.spy(object, 'method');
        var result = view.foldl(foldlCallback, '');
        expect(foldlCallback.callCount).to.equal(4);
        expect(result).to.equal('RalphLucyEdGo');

        // inject (alias of reduce)
        expect(view.inject).to.exists;
        expect(typeof view.inject).to.equal('function');
        var object = { method: function (memo, model) { return memo + model.get('name'); }};
        var injectCallback = sinon.spy(object, 'method');
        var result = view.inject(injectCallback, '');
        expect(injectCallback.callCount).to.equal(4);
        expect(result).to.equal('RalphLucyEdGo');

        // reduceRight
        expect(view.reduceRight).to.exists;
        expect(typeof view.reduceRight).to.equal('function');
        var object = { method: function (memo, model) { return memo + model.get('name'); }};
        var reduceRightCallback = sinon.spy(object, 'method');
        var result = view.reduceRight(reduceRightCallback, '');
        expect(reduceRightCallback.callCount).to.equal(4);
        expect(result).to.equal('GoEdLucyRalph');

        // foldr
        expect(view.foldr).to.exists;
        expect(typeof view.foldr).to.equal('function');
        var object = { method: function (memo, model) { return memo + model.get('name'); }};
        var foldrCallback = sinon.spy(object, 'method');
        var result = view.foldr(foldrCallback, '');
        expect(foldrCallback.callCount).to.equal(4);
        expect(result).to.equal('GoEdLucyRalph');

        // find
        expect(view.find).to.exists;
        expect(typeof view.find).to.equal('function');
        var result = view.find(function(model) {
            return model.get('name') == 'Lucy';
        });
        expect(result).to.equal(view.models[1]);

        // detect
        expect(view.detect).to.exists;
        expect(typeof view.detect).to.equal('function');
        var result = view.detect(function(model) {
            return model.get('name') == 'Lucy';
        });
        expect(result).to.equal(view.models[1]);

        // filter
        expect(view.filter).to.exists;
        expect(typeof view.filter).to.equal('function');
        var result = view.filter(function(model) {
            return model.get('name').length != 5;
        });
        expect(result.length).to.equal(3);
        expect(result[0]).to.equal(view.models[1]);
        expect(result[1]).to.equal(view.models[2]);
        expect(result[2]).to.equal(view.models[3]);

        // select (alias of filter)
        expect(view.select).to.exists;
        expect(typeof view.select).to.equal('function');
        var result = view.select(function(model) {
            return model.get('name').length != 5;
        });
        expect(result.length).to.equal(3);
        expect(result[0]).to.equal(view.models[1]);
        expect(result[1]).to.equal(view.models[2]);
        expect(result[2]).to.equal(view.models[3]);

        // reject
        expect(view.reject).to.exists;
        expect(typeof view.reject).to.equal('function');
        var result = view.reject(function(model) {
            return model.get('name').length == 2;
        });
        expect(result.length).to.equal(2);
        expect(result[0]).to.equal(view.models[0]);
        expect(result[1]).to.equal(view.models[1]);

        // every
        expect(view.every).to.exists;
        expect(typeof view.every).to.equal('function');
        var result = view.every(function(model) {
            return model.get('name').length < 6;
        });
        expect(result).to.be.true;

        // all (alias of every)
        expect(view.all).to.exists;
        expect(typeof view.all).to.equal('function');
        var result = view.all(function(model) {
            return model.get('name').length < 6;
        });
        expect(result).to.be.true;

        // some
        expect(view.some).to.exists;
        expect(typeof view.some).to.equal('function');
        var result = view.some(function (model) {
            return model.get('name') == 'Nick';
        });
        expect(result).to.be.false;

        // any (alias of some)
        expect(view.any).to.exists;
        expect(typeof view.any).to.equal('function');
        var result = view.any(function (model) {
            return model.get('name') == 'Nick';
        });
        expect(result).to.be.false;

        // contains
        expect(view.contains).to.exists;
        expect(typeof view.contains).to.equal('function');
        var result = view.contains(view.models[0]);
        expect(result).to.be.true;

        // include (alias of contains)
        expect(view.include).to.exists;
        expect(typeof view.include).to.equal('function');
        var result = view.include(view.models[0]);
        expect(result).to.be.true;

        // includes (alias of contains)
        expect(view.includes).to.exists;
        expect(typeof view.includes).to.equal('function');
        var result = view.includes(view.models[0]);
        expect(result).to.be.true;

        // invoke
        expect(view.invoke).to.exists;
        expect(typeof view.invoke).to.equal('function');
        var result = view.invoke('pick', 'age');
        expect(result.length).to.equal(4);
        expect(typeof result[0]).to.equal('object');
        expect(result[0].age).to.equal(3);
        expect(typeof result[1]).to.equal('object');
        expect(result[1].age).to.equal(5);
        expect(typeof result[2]).to.equal('object');
        expect(result[2].age).to.equal(7);
        expect(typeof result[3]).to.equal('object');
        expect(result[3].age).to.equal(2);

        // max
        expect(view.max).to.exists;
        expect(typeof view.max).to.equal('function');
        var result = view.max(function (model) {
            return model.get('age');
        });
        expect(result.get('age')).to.equal(7);

        // min
        expect(view.min).to.exists;
        expect(typeof view.min).to.equal('function');
        var result = view.min(function (model) {
            return model.get('age');
        });
        expect(result.get('age')).to.equal(2);

        // size
        expect(view.size).to.exists;
        expect(typeof view.size).to.equal('function');
        expect(view.size()).to.equal(4);

        // first
        expect(view.first).to.exists;
        expect(typeof view.first).to.equal('function');
        var result = view.first();
        expect(result.get('age')).to.equal(3);

        // head (alias of first)
        expect(view.head).to.exists;
        expect(typeof view.head).to.equal('function');
        var result = view.head();
        expect(result.get('age')).to.equal(3);

        // take (alias of first)
        expect(view.take).to.exists;
        expect(typeof view.take).to.equal('function');
        var result = view.take();
        expect(result.get('age')).to.equal(3);

        // initial
        expect(view.initial).to.exists;
        expect(typeof view.initial).to.equal('function');
        var result = view.initial();
        expect(result.length).to.equal(3);
        expect(result[0]).to.equal(view.models[0]);
        expect(result[1]).to.equal(view.models[1]);
        expect(result[2]).to.equal(view.models[2]);

        // rest
        expect(view.rest).to.exists;
        expect(typeof view.rest).to.equal('function');
        var result = view.rest();
        expect(result.length).to.equal(3);
        expect(result[0]).to.equal(view.models[1]);
        expect(result[1]).to.equal(view.models[2]);
        expect(result[2]).to.equal(view.models[3]);

        // tail (alias of rest)
        expect(view.tail).to.exists;
        expect(typeof view.tail).to.equal('function');
        var result = view.tail();
        expect(result.length).to.equal(3);
        expect(result[0]).to.equal(view.models[1]);
        expect(result[1]).to.equal(view.models[2]);
        expect(result[2]).to.equal(view.models[3]);

        // drop
        expect(view.drop).to.exists;
        expect(typeof view.drop).to.equal('function');
        var result = view.drop();
        expect(result.length).to.equal(3);
        expect(result[0]).to.equal(view.models[1]);
        expect(result[1]).to.equal(view.models[2]);
        expect(result[2]).to.equal(view.models[3]);

        // last
        expect(view.last).to.exists;
        expect(typeof view.last).to.equal('function');
        var result = view.last();
        expect(result.get('age')).to.equal(2);

        // without
        expect(view.without).to.exists;
        expect(typeof view.without).to.equal('function');
        var result = view.without(view.models[1]);
        expect(result.length).to.equal(3);

        // difference
        expect(view.difference).to.exists;
        expect(typeof view.difference).to.equal('function');
        var result = view.difference([view.models[1]]);
        expect(result.length).to.equal(3);

        // indexOf
        expect(view.indexOf).to.exists;
        expect(typeof view.indexOf).to.equal('function');
        expect(view.indexOf(view.models[1])).to.equal(1);

        // shuffle
        expect(view.shuffle).to.exists;
        expect(typeof view.shuffle).to.equal('function');

        // lastIndexOf
        expect(view.lastIndexOf).to.exists;
        expect(typeof view.lastIndexOf).to.equal('function');
        expect(view.lastIndexOf(view.models[1])).to.equal(1);

        // isEmpty
        expect(view.isEmpty).to.exists;
        expect(typeof view.isEmpty).to.equal('function');
        expect(view.isEmpty()).to.be.false;

        // chain
        expect(view.chain).to.exists;
        expect(typeof view.chain).to.equal('function');
        var result = view.chain().map(function(model) {
            return model.get('name');
        }).first().value();
        expect(result).to.equal('Ralph');

        // sample
        expect(view.sample).to.exists;
        expect(typeof view.sample).to.equal('function');

        // partition
        expect(view.partition).to.exists;
        expect(typeof view.partition).to.equal('function');
        var result = view.partition(function(model) {
            return model.get('name').length == 5;
        });
        expect(result.length).to.equal(2);

        // groupBy
        expect(view.groupBy).to.exists;
        expect(typeof view.groupBy).to.equal('function');
        var result = view.groupBy(function(model) {
            return model.get('name').length;
        });
        expect(result[4]).to.exists;
        expect(result[2]).to.exists;
        expect(result[5]).to.exists;
        expect(result[4][0]).to.equal(view.models[1]);
        expect(result[2][0]).to.equal(view.models[2]);
        expect(result[2][1]).to.equal(view.models[3]);
        expect(result[5][0]).to.equal(view.models[0]);

        // countBy
        expect(view.countBy).to.exists;
        expect(typeof view.countBy).to.equal('function');
        var result = view.countBy(function(model) {
            return model.get('name').length;
        });
        expect(result[2]).to.exists;
        expect(result[4]).to.exists;
        expect(result[5]).to.exists;
        expect(result[2]).to.equal(2);
        expect(result[4]).to.equal(1);
        expect(result[5]).to.equal(1);

        // sortBy
        expect(view.sortBy).to.exists;
        expect(typeof view.sortBy).to.equal('function');
        var result = view.sortBy(function(model) {
            return model.get('name').substring(1);
        });
        expect(result[0].get('name')).to.equal('Ralph');
        expect(result[1].get('name')).to.equal('Ed');
        expect(result[2].get('name')).to.equal('Go');
        expect(result[3].get('name')).to.equal('Lucy');

        // indexBy
        expect(view.indexBy).to.exists;
        expect(typeof view.indexBy).to.equal('function');
        var result = view.indexBy(function(model) {
            return model.get('name');
        });
        expect(result['Ralph']).to.equal(view.models[0]);
        expect(result['Lucy']).to.equal(view.models[1]);
        expect(result['Ed']).to.equal(view.models[2]);
        expect(result['Go']).to.equal(view.models[3]);

        // findIndex
        expect(view.findIndex).to.exists;
        expect(typeof view.findIndex).to.equal('function');
        var result = view.findIndex(function(model) {
            return model.get('name') == 'Lucy';
        });
        expect(result).to.equal(1);

        // findLastIndex
        expect(view.findLastIndex).to.exists;
        expect(typeof view.findLastIndex).to.equal('function');
        var result = view.findLastIndex(function(model) {
            return model.get('name').length == 2;
        });
        expect(result).to.equal(3);
    });
});
