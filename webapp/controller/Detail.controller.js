sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/ColumnListItem",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/MessageToast"
], function(Controller, ColumnListItem, Input, Button) {
    "use strict";
    return Controller.extend("com.grilo.classification.com.grilo.classification.controller.Detail", {
        onInit: function(){
            console.log("route matched");
            let oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRoutePatternMatched(this._onRouteMatched, this);
            this._newRowVisible = false;
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
            let sClass = oEvent.getParameter("selectedItem").getProperty("key");
            let oTable = this.getView().byId("classTable");
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
                                new Input({
                                    value: "{charId}",
                                    editable: false,
                                    valueHelpRequest : this._onCharacteristicValueRequest
                                }),
                                new Input({
                                    value: "{charValue}",
                                    editable: true
                                }),
                                new Input({
                                    value: "{charUom}",
                                    editable: false
                                }),
                                // new Button({
                                //     icon: "sap-icon://user-edit",
                                //     press: that.onChangePress
                                // })
                            ]
                })
            });
            //as soon as an entry is selected, the user can then create new entries or save them.
            let oClass = this.getView().byId("detailClassSelect").getSelectedItem()//getSelectedKey("")
            if (oClass) {
                this.getView().byId("addCharData").setEnabled(true);
                this.getView().byId("saveCharData").setEnabled(true);
            }
        
        },
        _getPosOfClass : function(oModelData, sClass) {
            return oModelData.findIndex((oClass) => //works like Python lambda... this is a testing function, not your regular arrow function
                oClass["class"] === sClass
            );
        },

        _onCharacteristicValueRequest : function() {
            /**
             * sets the characteristic value help for the characteristic field.
             */
        },
        
        _changedCell : null, 

        // onChangePress: function(oEvent) {
        //     /**
        //      * Gets the current row of the table to allow the user to change it
        //      * Considers the id of the parent of the button (the cell) as the selected row.
        //      * 
        //      */
        //     // let aIdSplit = oEvent.getSource().getParent().getId().split("-");
        //     // let iId = Number(aIdSplit[aIdSplit.length - 1]);
        //     // let aSelectedRowCells = oEvent.getSource().getParent()
        //     let oCharValue = oEvent.getSource().getParent().getCells()[1];
        //     this._changedCell = oCharValue;
        //     oCharValue.setEditable(!oCharValue.getEditable());
        //     //TODO: make this changeable for the cell that was changed. only once at a time or massive change, also.
        //     console.log(oEvent);
        // },

        onAddRow : function(oEvent) {
            /**
             * Adds a row to the table of characteristics. This makes the app enter in a state of "Adding". I should be able to remove this newly
             * entered row while the entry was not commited (i.e, saved) yet).
             * For simplicity and for now, forces that only one char can be created at a time
             */
            let oTable = this.getView().byId("classTable");
            this._enterAddCharState(oTable);
        },

        _enterAddCharState: function(oTable) {
            /**
             * Add state: only one row at a time can be added. This state adds a new button to remove the current row and revert back to the changing state.
             * While adding a characteristic, the other ones would not be changed. Of course this is not mandatory, because we could just sent the
             * screen data back to the backend to update the characteristics, but i think this is suboptimal
            */
            oTable.getItems().forEach((row) => {
                let oCharValueInput = row.getCells()[1]; 
                oCharValueInput.setEnabled(!oCharValueInput.getEnabled());
            });
            this.getView().byId("addCharData").setEnabled(false);
            let oTableBindingContext = oTable.getBindingContext();
            let oTableModel = oTableBindingContext.getModel();
            let oTableModelPath = oTableBindingContext.getPath();
            let oTableModelData = oTableModel.getData(oTableModelPath);
            this._addCells(oTable);
        },

        _addCells : function(oTable) {
            let oItem = new ColumnListItem({
                cells:[
                    new Input({
                        value: "",
                        editable: true,
                        showValueHelp: true,
                        valueHelpRequest : this._onCharacteristicValueRequest
                    }),
                    new Input({
                        value: "",
                        editable: true
                    }),
                    new Input({
                        value: "",
                        editable: false
                    }),
                ]
            });
            oTable.addItem(oItem);
        },

        onUndoPressed : function(oEvent) {
            console.log("undo pressed");
        },

        onSavePressed : function(oEvent) {
            /**
             * This event will trigger the oData request to save the new characteristic in the backend.
             * As a mockup, it only adds to the current table 
             */
            // in a real world scenario, this wil lbe implemented in the callback request to the odata service
            // re-enable the other rows before adding the new one, otherwise the last one will be in a different state.
            let oTable = this.getView().byId("classTable");
            let oTableItems = oTable.getItems();
            // change only the n - 1 rows' state to be input again once it's saved. this would be called in the
            // callback success of the odata call.
            for (let index = 0; index < oTableItems.length - 1; index++){
                let oCharValueInput = oTableItems[index].getCells()[1]; 
                oCharValueInput.setEnabled(!oCharValueInput.getEnabled());
            }
            //The last added char is always set as not editable
            let oLastAddedRow = oTableItems[oTableItems.length - 1].getCells()[0].setEnabled(false);
            let oNewData = oLastAddedRow.getCells();      
            //updates the model (with new row appended to the table).
            let oContext = oTable.getBindingContext()
            let oContextPath = oContext.getPath();
            let aData = this.getView().getModel().getProperty(oContextPath);
            //get the new entry:
            let oNewEntry = {
                "charId" : oNewData[0].getValue(),
                "charValue" : oNewData[1].getValue(),
                "charUom": oNewData[2].getValue()
            } 
            aData.push(oNewEntry);
            // disable the save button:
            this.getView().byId("addCharData").setEnabled(true);
            this.getView().byId("saveCharData").setEnabled(false);

        },

    });
})