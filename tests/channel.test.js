describe('Prism.Channel tests', function() {
    it('Should implement events API', function () {
        var channel = new Backbone.Prism.Channel();

        expect(channel.trigger).toBe(Backbone.Events.trigger);
        expect(channel.listenTo).toBe(Backbone.Events.listenTo);
        expect(channel.listenToOnce).toBe(Backbone.Events.listenToOnce);
        expect(channel.stopListening).toBe(Backbone.Events.stopListening);
        expect(channel.on).toBe(Backbone.Events.on);
        expect(channel.off).toBe(Backbone.Events.off);

        expect(channel.request).toBe(Backbone.Radio.Requests.request);
        expect(channel.reply).toBe(Backbone.Radio.Requests.reply);
    });

    it('Should stop listening', function () {
        var channel = new Backbone.Prism.Channel();

        var callbacks = {
            replier: function () {
                return;
            },

            listener: function () {
                return;
            }
        };

        spyOn(callbacks, 'replier');
        spyOn(callbacks, 'listener');

        channel.reply('request', callbacks.replier);
        channel.on('event', callbacks.listener);

        channel.request('request');
        channel.trigger('event');

        channel.destroy();

        channel.request('request');
        channel.trigger('event');

        expect(callbacks.replier).toHaveBeenCalled();
        expect(callbacks.replier.calls.count()).toBe(1);

        expect(callbacks.listener).toHaveBeenCalled();
        expect(callbacks.listener.calls.count()).toBe(1);
    });
});
