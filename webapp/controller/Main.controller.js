sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageBox) => {
    "use strict";

    return Controller.extend("com.grilo.classification.com.grilo.classification.controller.Main", {
        onInit() {
            let oModel = new JSONModel("../model/model.json");
            this.getOwnerComponent().setModel(oModel); //tip: if you want this model to be used in the binding context of another
            //view/objects, then I suggest you to bind the model to the ownner component (app descriptor) rather than the current view...
        },

        onEnterButtonPressed: function(oEvent) {
            /**
             * Defines the search criteria to find whether the object and the class type exists in the backend
             * In case it does not find, an Error dialog will be displayed
             * Note that as the model is a JSON Model, the idea is to find the equipment class
             */
            let sObject = this.getView().byId("objectInput").getValue();
            let sClassType = this.getView().byId("objectTypeInput").getValue();
            let aMainData = this.getView().getModel().getData()["objects"];
            let iFound = -1;
            for (let iIndex = 0; iIndex < aMainData.length; iIndex++) {
                let oItem = aMainData[iIndex];
                if (oItem["object"] === sObject && oItem["classType"] === sClassType) {
                    iFound = iIndex;
                    break;
                }
            }
            if (iFound === -1) {
                MessageBox.show("No data matching input parameters found!", {
                    icon: MessageBox.Icon.ERROR,
                    title: "Error",
                    actions: MessageBox.Action.Close,
                });
                return;
            }
            let oRouter = this.getOwnerComponent().getRouter();
            //let oRouter = this.getView().getRouter();
            oRouter.navTo("RouteDetail", {
                // "equip": sObject,
                // "classType": sClassType,
                "id": iFound
            });
            console.log("clicked");
        }
    });
});