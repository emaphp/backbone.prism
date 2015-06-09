describe('Prism.StateView tests', function() {
    it('Should initialize', function () {
        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State({name: 'emaphp', role: 'developer'});
        var view = state.createView({
            name: 'test'
        });
        expect(view.parent).toBe(state);
        expect(view.name).toBe('test');
        expect(view._isInitialized).toBe(false);

        state.start();
        expect(view._isInitialized).toBe(true);
        expect(view.attributes).toBeDefined();
        expect(view.attributes.name).toBe('emaphp');
        expect(view.attributes.role).toBe('developer');
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

        spyOn(listener, 'callback');
        view.on('sync', listener.callback);
        state.start();
        expect(listener.callback).toHaveBeenCalled();
    });

    it('Should export cid', function () {
        var State = Backbone.Prism.State.extend({
            name: 'state'
        });

        var state = new State({name: 'emaphp', role: 'developer'});
        var view = state.createView({
            name: 'test'
        });

        state.start();
        var values = view.toJSON();
        expect(values.name).toBe('emaphp');
        expect(values.role).toBe('developer');
        expect(values.cid).toBeDefined();
        expect(values.cid).toMatch(/^c/);
    });

    it('Should mutate options', function () {
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

        spyOn(listener, 'callback');
        var mutator = view.createMutator(function () {
            return {
                display: display
            };
        });
        mutator.on('apply', listener.callback);

        state.start();
        expect(listener.callback).not.toHaveBeenCalled(); // first update is silent
        expect(view.options.display).toBe('align-left');
        display = 'align-right';
        mutator.apply();
        expect(listener.callback).toHaveBeenCalled();
        expect(view.options.display).toBe('align-right');
    });
});
