sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/grilo/classification/com/grilo/classification/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.grilo.classification.com.grilo.classification.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");
            this.setModel(models.createModel("../model/objects.json","Objects"), "Objects");
            this.setModel(models.createModel("../model/classType.json", "ClassType"), "ClassType");
            this.setModel(models.createModel("../model/classes.json"), "Classes");

            // enable routing
            this.getRouter().initialize();
        }
    });
});