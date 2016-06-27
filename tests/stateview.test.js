describe('Prism.StateView tests', function() {
    it('Should initialize', function () {
        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State({name: 'emaphp', role: 'developer'});
        var view = state.createView({
            name: 'test'
        });
        expect(view.parent).to.equal(state);
        expect(view.name).to.equal('test');
        expect(view._isInitialized).to.be.false;

        state.publish();
        expect(view._isInitialized).to.be.true;
        expect(view.attributes).to.exist;
        expect(view.attributes.name).to.equal('emaphp');
        expect(view.attributes.role).to.equal('developer');
    });

    it('Should trigger sync event', function () {
        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State({name: 'emaphp', role: 'developer'});
        var view = state.createView({
            name: 'test'
        });

        var listener = {
            callback: function () {
                return;
            }
        };

        var spy = sinon.spy(listener, 'callback');
        view.on('sync', listener.callback);
        state.publish();
        expect(spy.called).to.be.true;
    });

    it('Should export cid', function () {
        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State({name: 'emaphp', role: 'developer'});
        var view = state.createView({
            name: 'test'
        });

        state.publish();
        var values = view.toJSON();
        expect(values.name).to.equal('emaphp');
        expect(values.role).to.equal('developer');
        expect(values.cid).to.exist;
        expect(values.cid).to.match(/^c/);
    });

    it('Should modify options', function () {
        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State({name: 'emaphp', role: 'developer'});
        var display = 'align-left';
        var view = state.createView({
            name: 'test',
            display: 'centered'
        });


        var listener = {
            callback: function () {
                return;
            }
        };

        var spy = sinon.spy(listener, 'callback');
        var config = view.createConfig(null, function () {
            return {
                display: display
            };
        });
        config.on('set', listener.callback);

        state.publish();
        expect(spy.called).to.be.false; // first update is silent
        expect(view.options.display).to.equal('align-left');
        display = 'align-right';
        config.apply();
        expect(spy.called).to.be.true;
        expect(view.options.display).to.equal('align-right');
    });

    it('Should update subview', function () {
        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State({name: 'emaphp', role: 'developer'});
        var view = state.createView({
            name: 'view'
        });
        var subview = view.createView({
			      name: 'subview',
			      listenTo: 'sync'
		    });


		    state.publish();
		    expect(view.attributes.name).to.equal('emaphp');
		    expect(view.attributes.cid).to.equal(state.cid);
		    expect(subview.attributes.name).to.equal('emaphp');
		    expect(subview.attributes.cid).to.equal(view.attributes.cid);
	  });

    it('Should implement underscore.js methods', function () {
        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State({name: 'emaphp', role: 'developer'});
        var view = state.createView({
            name: 'test'
        });
        state.publish();

        // keys
        expect(view.keys).to.exists;
        expect(typeof view.keys).to.equal('function');
        var result = view.keys();
        expect(result.length).to.equal(3);

        // values
        expect(view.values).to.exists;
        expect(typeof view.values).to.equal('function');
        var result = view.values();
        expect(result.length).to.equal(3);

        // pairs
        expect(view.pairs).to.exists;
        expect(typeof view.pairs).to.equal('function');
        var result = view.pairs();
        expect(result.length).to.equal(3);

        // invert
        expect(view.invert).to.exists;
        expect(typeof view.invert).to.equal('function');
        var result = view.invert();
        expect(result.emaphp).to.exists;
        expect(result.emaphp).to.equal('name');
        expect(result.developer).to.exists;
        expect(result.developer).to.equal('role');

        // pick
        expect(view.pick).to.exists;
        expect(typeof view.pick).to.equal('function');
        var result = view.pick('role');
        expect(result.role).to.exists;
        expect(result.name).to.be.undefined;
        expect(result.role).to.equal('developer');

        // omit
        expect(view.omit).to.exists;
        expect(typeof view.omit).to.equal('function');
        var result = view.omit('role');
        expect(result.role).to.be.undefined;
        expect(result.name).to.exists;
        expect(result.name).to.equal('emaphp');

        // chain
        expect(view.chain).to.exists;
        expect(typeof view.chain).to.equal('function');
        var result = view.chain().pick('role').value();
        expect(result.role).to.exists;
        expect(result.name).to.be.undefined;
        expect(result.role).to.equal('developer');

        // isEmpty
        expect(view.isEmpty).to.exists;
        expect(typeof view.isEmpty).to.equal('function');
        expect(view.isEmpty()).to.be.false;
    });
});
