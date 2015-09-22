describe('Prism.Dispatcher tests', function() {
    it('Should add methods', function () {
        var dispatcher = new Backbone.Prism.Dispatcher();
        var store = new Backbone.Prism.Store();
        expect(dispatcher.handleViewAction).toBeDefined();
        expect(dispatcher.handleServerAction).toBeDefined();
    });

    it('Should call store method', function () {
        var store = new Backbone.Prism.Store();
        var dispatcher = new Backbone.Prism.Dispatcher();
        var methods = {
            'test-callback': function () {
            }
        };

        spyOn(methods, 'test-callback');
        dispatcher.register(function(payload) {
			var action = payload.action;
			
			switch (payload.action.type) {
				case 'test-callback':
					methods['test-callback']();
				break
				
				default:
			}
		});
        
        dispatcher.handleViewAction({
            type: 'test-callback'
        });
        expect(methods['test-callback']).toHaveBeenCalled();
    });
});
