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
            this.getOwnerComponent().setModel(oModel); 
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
            let oClassType = oView.byId("objectTypeSelect").getSelectedItem().getText();
            let sClassType = oClassType.split(" ")[0]
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
                let oBundle = this.getView().getModel("i18n").getResourceBundle();
                let oNewClassAssignText = oBundle.getText("newClassChar");
                let sCreateNewClass = oBundle.getText("createClassInfo");
                // note: we should add a validation to whether the current object has the correct class type.
                MessageBox.show(oNewClassAssignText, {
                    icon: MessageBox.Icon.INFO,
                    title: sCreateNewClass,
                    actions: [MessageBox.Action.OK, MessageBox.Action.CLOSE],
                    onClose: this.onMessageBoxAction,
                    dependentOn: this.getView()
                });

            }
            else {
                let oRouter = this.getOwnerComponent().getRouter();
                //let oRouter = oView.getRouter();
                oRouter.navTo("RouteDetail", {
                    // "equip": sObject,
                    // "classType": sClassType,
                    "id": iFound
                });
            }
        },

        onMessageBoxAction : function(oAction) {
            console.log("MessageBoxActionSet");
            if (oAction === 'OK') {
                let oController = this.dependentOn.getController();
                let oRouter = oController.getOwnerComponent().getRouter();
                let sObjectId = oController.byId("objectInput").getValue();
                let sObjectType = oController.byId("objectTypeSelect").getSelectedItem().getText().split("-")[0].trim();
                oRouter.navTo("RouteDetailNew", {
                    "id": sObjectId,
                    "classType": sObjectType
                });
            }
        },
            
        _oFragmentEquipSearch : null,

        onObjectValueHelpPressed: async function(oEvent) {
            let oView = this.getView();
            let oClassType = oView.byId("objectTypeSelect").getSelectedItem();
            if (!oClassType) {
                //the class type is required to trigger a request for the object value help.
                MessageBox.show("Please provide a class type before proceeding", {
                    icon: MessageBox.Icon.ERROR,
                    title: "Error",
                    actions: MessageBox.Action.Close,
                });
                return;
            }
            let sClassType = oClassType.getText();
            console.log("pressed");
            if (!this._oFragmentEquipSearch) {
                this._oFragmentEquipSearch = await Fragment.load({
                    id: oView.getId(),
                    name: "com.grilo.classification.com.grilo.classification.view.valueHelpChar",
                    controller: this
                });
            }
            let oObjectModel = oView.getModel("Objects");
            this._oFragmentEquipSearch.setModel(oObjectModel);
            let sClassId = sClassType.split(" ")[0];
            let aFilters = []
            let oFragmentItemsBinding = this._oFragmentEquipSearch.getBinding("items");
            /*
             * independent of whether the characteristic selection has been filtered based on the equipmen, reset it to its initial state to avoid
             * having wrong filters.            
             */
            oFragmentItemsBinding.aFilters = aFilters;
            let oFilter = new Filter({
                path: "ClassType",
                operator: FilterOperator.EQ,
                value1: sClassId
            });
            aFilters.push(oFilter);
            oFragmentItemsBinding.filter(aFilters);
            this._oFragmentEquipSearch.open();
        },

        onSelectedOptionInValueHelp : function(oEvent) {
            let aSelectedItemTitle = oEvent.getParameter("selectedItem").getProperty("title").split(" ");
            let sObjectId = aSelectedItemTitle[aSelectedItemTitle.length - 1];
            this.getView().byId("objectInput").setValue(sObjectId);
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
    });;
});