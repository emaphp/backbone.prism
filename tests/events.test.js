describe('Prism.Channel tests', function() {
    it('Should implement events API', function () {
        expect(Backbone.Prism.Events.trigger).toBe(Backbone.Events.trigger);
        expect(Backbone.Prism.Events.listenTo).toBe(Backbone.Events.listenTo);
        expect(Backbone.Prism.Events.listenToOnce).toBe(Backbone.Events.listenToOnce);
        expect(Backbone.Prism.Events.stopListening).toBe(Backbone.Events.stopListening);
        expect(Backbone.Prism.Events.on).toBe(Backbone.Events.on);
        expect(Backbone.Prism.Events.off).toBe(Backbone.Events.off);

        expect(Backbone.Prism.Events.request).toBe(Backbone.Radio.Requests.request);
        expect(Backbone.Prism.Events.reply).toBe(Backbone.Radio.Requests.reply);
    });
});
