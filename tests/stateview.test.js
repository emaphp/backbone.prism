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
});
