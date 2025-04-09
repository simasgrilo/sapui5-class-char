sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, JSONModel, MessageBox, Fragment, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("com.grilo.classification.com.grilo.classification.controller.Main", {
        onInit() {
            let oModel = new JSONModel("../model/model.json");
            this.getOwnerComponent().setModel(oModel); //tip: if you want this model to be used in the binding context of another
            //view/objects, then I suggest you to bind the model to the ownner component (app descriptor) rather than the current view...
            // ERICK: 04/04/2025
            this.setViewNamedModel("../model/characteristic.json", "characteristics");
            this.setViewNamedModel("../model/classType.json", "ClassType");
            this.setViewNamedModel("../model/objects.json", "Objects");
        },

        setViewNamedModel : function(sModelPath, sModelName) {
            let oModel = new JSONModel(sModelPath, sModelName);
            this.getView().setModel(oModel, sModelName);     
        },

        onEnterButtonPressed: function(oEvent) {
            /**
             * Defines the search criteria to find whether the object and the class type exists in the backend
             * In case it does not find, an Error dialog will be displayed
             * Note that as the model is a JSON Model, the idea is to find the equipment class
             */
            let oView = this.getView();
            let sObject = oView.byId("objectInput").getValue();
            let sClassType = oView.byId("objectTypeInput").getValue();
            if (!sObject || !sClassType) {
                MessageBox.show("Please provide both the object and the class type", {
                    icon: MessageBox.Icon.ERROR,
                    title: "Error",
                    actions: MessageBox.Action.Close,
                });
                return;                
            }
            let aMainData = oView.getModel().getData()["objects"];
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
            //let oRouter = oView.getRouter();
            oRouter.navTo("RouteDetail", {
                // "equip": sObject,
                // "classType": sClassType,
                "id": iFound
            });
        },
    
        _oFragmentEquipSearch : null,

        onEquipmentValueHelpPressed: async function(oEvent) {
            let oView = this.getView();
            let sClassType = oView.byId("objectTypeInput").getValue();
            if (!sClassType) {
                //the class type is required to trigger a request for the object value help.
                MessageBox.show("Please provide a class type before proceeding", {
                    icon: MessageBox.Icon.ERROR,
                    title: "Error",
                    actions: MessageBox.Action.Close,
                });
                return;
            }
            console.log("pressed");
            if (!this._oFragmentEquipSearch) {
                this._oFragmentEquipSearch = await Fragment.load({
                    id: oView.getId(),
                    name: "com.grilo.classification.com.grilo.classification.view.valueHelpChar",
                    controller: this
                });
                //after loading the fragment, we need to set the aggregation for items based on the selected class
                //filter everybody in the model that matches the class type.
                //In fact, it's a matter of filtering the model allocated to the field objectInput.
                //this needs to be done in both for the popup and for the suggestion:
                let oObjectBinding = this.getView().byId("objectInput").getBinding("suggestionItems");
                let sClassType = this.getView().byId("objectTypeInput").getValue();
                let aFilters = [];
            }
        },

        onSuggestObject: function(oEvent) {
            let oObjectInput = this.getView().byId("objectInput");
            let oObjectBinding = oObjectInput.getBinding("suggestionItems");
            let oClassTypeSelected = this.getView().byId("objectTypeSelect").getSelectedItem().getText();
            let sClassType = oClassTypeSelected.split(" ")[0];
            //get rid of the previous filter, if any
            oObjectBinding.aFilters = null;
            let aFilters = [];
            let oFilter = new Filter({
                path: "ClassType", //path for the binding path of the aggregation
                operator: FilterOperator.Contains,
                value1: sClassType
            });
            aFilters.push(oFilter);
            oObjectBinding.filter(aFilters);
            // oObjectInput.getModel().refresh(true);

        }
    });
});