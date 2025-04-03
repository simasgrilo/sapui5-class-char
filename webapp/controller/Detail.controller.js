sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/m/Button"
], function(Controller, ColumnListItem, Text, Button) {
    "use strict";
    return Controller.extend("com.grilo.classification.com.grilo.classification.controller.Detail", {
        onInit: function(){
            console.log("route matched");
            let oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRoutePatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched : function(oEvent) {
            let iIndex = oEvent.getParameter("arguments")["id"]
            let sBindEntry = `/objects/${iIndex}`;
            this.getView().bindElement(sBindEntry);
        },

        pressMe: function(oEvent){
            console.log(oEvent);
        },

        onSelectedClass : function(oEvent) {
            console.log("selected item");
            let sClass = oEvent.getParameter("selectedItem").getProperty("key");
            let oTable = this.getView().byId("classTable");
            // let sBindingContext = `${this.getView().byId("detailClassSelect").getBindingContext().getPath()}/classes/`;
            //TODO: find the remainder of the binding path that should be classes/<pos>/chars. <pos> needs to be calculated from the array of classes.
            let oModel = this.getView().getModel()
            let oModelData = oModel.getProperty(this.getView().getBindingContext().getPath())["classes"]
            let iPos = this._getPosOfClass(oModelData, sClass);
            if (!iPos === -1) {
                //this should never occur as the set of entries in the Select control alreay exists in the model.
                return;
            }
            let sBindingContextPath = `${this.getView().getBindingContext().getPath()}/classes/${iPos}/chars`;
            oTable.bindElement(sBindingContextPath); //bindElement does not bind automatically aggregation, only allows resolving binding path for properties
            let that = this;
            oTable.bindAggregation("items", {
                path: sBindingContextPath,
                template : new ColumnListItem({
                    cells : [
                                new Text({
                                    text: "{charId}"
                                }),
                                new Text({
                                    text: "{charValue}"
                                }),
                                new Text({
                                    text: "{charUom}"
                                }),
                                new Button({
                                    icon: "sap-icon://user-edit",
                                    press: that.onChangePress
                                })
                            ]
                })
            });
        },
        _getPosOfClass : function(oModelData, sClass) {
            return oModelData.findIndex((oClass) => //works like Python lambda... this is a testing function, not your regular arrow function
                oClass["class"] === sClass
            );
        }

    });
})