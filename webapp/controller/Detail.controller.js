sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/ColumnListItem",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function(Controller, ColumnListItem, Input, Button, MessageBox, JSONModel, Fragment, Filter, FilterOperator) {
    "use strict";
    return Controller.extend("com.grilo.classification.com.grilo.classification.controller.Detail", {
        onInit: function(){
            console.log("route matched");
            let oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRoutePatternMatched(this._onRouteMatched, this);
            this._newRowVisible = false;
            this.setViewNamedModel("../model/characteristic.json", "characteristics");
        },

        _onRouteMatched : function(oEvent) {
            let sRouteName = oEvent.getParameter("name");
            let oObjectId = this.getView().byId("detailObjectInput");
            let oObjectClassType = this.getView().byId("detailObjectTypeInput");
            this.getView().byId("removeClass").setVisible(false);  
            //also clear the selected value so the user can reinput that
            this.getView().byId("detailClassSelect").setSelectedItem(null);
            switch (sRouteName) {
                case ("RouteDetail"):
                    let iIndex = oEvent.getParameter("arguments")["id"];
                    let sBindEntry = `/objects/${iIndex}`;
                    this.getView().bindElement(sBindEntry);
                    oObjectId.bindValue("object");
                    oObjectClassType.bindValue("classType");
                    // the object description is in another model. This can be changed in the data's design if desired.
                    // therefore, we need to get the current object and retrieve this from the Objects model:
                    let oObject = this.getView().getModel().getProperty(sBindEntry);
                    this._setObjectDescription(oObject["object"]);
                    this._setObjectTypeDescription(oObject["classType"]);
                    break;
                case ("RouteDetailNew"):
                    let oParameters = oEvent.getParameter("arguments")
                    let sObjectId = oParameters["id"];
                    let sObjectClassType = oParameters["classType"];
                    // In this case, use "UnbindProperty to correclty setup the input value"
                    oObjectId.unbindProperty("value");
                    oObjectId.setValue(sObjectId);
                    oObjectClassType.unbindProperty("value");
                    oObjectClassType.setValue(sObjectClassType);
                    this._setObjectDescription(sObjectId);
                    this._setObjectTypeDescription(sObjectClassType);
                }
            
        },

        _setObjectDescription: function(sObjectId) {
            let oObjectModelData = this.getOwnerComponent().getModel("Objects").getData()["Objects"];
            let sObjectDesc = oObjectModelData.find((elem) => elem["ID"] === sObjectId);
            if (!sObjectDesc) {
                return;
            }
            this.getView().byId("detailObjectDesc").setText(sObjectDesc["Description"]);
        },

        _setObjectTypeDescription : function(sObjectTypeId) {
            let oClassTypeModelData = this.getOwnerComponent().getModel("ClassType").getData()["classTypes"];
            let sObjectDesc = oClassTypeModelData.find((elem) => elem["ID"] === sObjectTypeId);
            if (!sObjectDesc) {
                return;
            }
            this.getView().byId("detailObjectTypeDesc").setText(sObjectDesc["Description"]);
        },
        
        setViewNamedModel : function(sModelPath, sModelName) {
            let oModel = new JSONModel(sModelPath, sModelName);
            this.getView().setModel(oModel, sModelName);     
        },

        pressMe: function(oEvent){
            console.log(oEvent);
        },

        onSelectedClass : function(oEvent) {
            /*
            * Callback method to select the characteristics when a class is selected. Essentially, this would trigger an oData call
            * to the backend upon selection. It also adds a "trash bin" button to delete the class assignment.
            *
            */
            let sClass = oEvent.getParameter("selectedItem").getProperty("key");
            let oTable = this.getView().byId("classTable");
            let oModel = this.getView().getModel()
            let oModelData = oModel.getProperty(this.getView().getBindingContext().getPath())["classes"]
            let iPos = this._getPosOfClass(oModelData, sClass);
            if (!iPos === -1) {
                //this should never occur as the set of entries in the Select control alreay exists in the model.
                return;
            }
            //allow the removal button to be displayed only if it has found a selected class
            this.getView().byId("removeClass").setVisible(true);
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

        onDeleteClassButtonClick : function(oEvent) {
            /*
            * callback to remove the class assignment from the model
            * @param {sap.ui.base.Event} oEvent - Button Event that triggered this callback
            * note that this is a PoC, this is removed from the JSON model by getting the binding context of the view
            * and then removing the selected class from it.
            * in a oData model, this would trigger a DELETE request to the backend,
            * and the whole model deletion should also hit the class-characteristic relation in the backend.
            */
           let oSelectControl= this.getView().byId("detailClassSelect");
           let sSelectedClass= oSelectControl.getSelectedItem().getKey();
           let oSelectControlModel = oSelectControl.getModel();
           let oSelectControlBindingPath = oSelectControl.getBinding("items").getPath()
           let sViewBindingPath = this.getView().getBindingContext().getPath();
           let sClassPropertyPath = `${sViewBindingPath}/${oSelectControlBindingPath}`
           let aClassModelData = oSelectControlModel.getProperty(sClassPropertyPath);
           if (aClassModelData) {
            let iClassIndex = aClassModelData.findIndex((elem) => elem['class'] === sSelectedClass);
            aClassModelData.splice(iClassIndex, 1);
            oSelectControlModel.setProperty(sClassPropertyPath, aClassModelData);
           }

        },

        _oCharDetailFragment : null,

        _onCharacteristicValueRequest : async function(oEvent) {
            /**
             * sets the characteristic value help for the characteristic field.
             * note: currently only supports single-valued characteristics
            */
           let oView = this.getParent().getParent().getParent().getParent().getParent();
            if (!this._oCharDetailFragment) {
                this._oCharDetailFragment = await Fragment.load({
                    id: oView.getId(),
                    name: "com.grilo.classification.com.grilo.classification.view.valueHelpCharDetail",
                    controller: oView.getController()
                });
                let oCharSelectDialog = oView.byId("charSelectDialog");
                oCharSelectDialog.setModel(this.getModel("characteristics"), "characteristics");
            }
            this._oCharDetailFragment.open();
        },

        onSelectedCharInHelp: function(oEvent) {
            /**
             * Copies the content of the characteristic selected
             */
            let oSelectedItemTitle = oEvent.getParameter("selectedItem").getTitle();
            let oSelectedItemDesc = oEvent.getParameter("selectedItem").getDescription();
            let oTableRows = this.getView().byId("classTable").getItems();
            let oNewItem = oTableRows[oTableRows.length - 1];
            let oSelectedItemCells = oNewItem.getCells();
            oSelectedItemCells[0].setValue(oSelectedItemTitle);
            oSelectedItemCells[2].setValue(oSelectedItemDesc);
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
            let oLastAddedRow = oTableItems[oTableItems.length - 1];
            let oLastAddedChar = oLastAddedRow.getCells()[0].getValue();
            if (!this.validateChar(oLastAddedChar)) {
                MessageBox.show("Please provide both the object and the class type", {
                    icon: MessageBox.Icon.ERROR,
                    title: "Error",
                    actions: MessageBox.Action.Close,
                });
                return;
            }
            // change only the n - 1 rows' state to be input again once it's saved. this would be called in the
            // callback success of the odata call.
            for (let index = 0; index < oTableItems.length - 1; index++){
                let oCharValueInput = oTableItems[index].getCells()[1]; 
                oCharValueInput.setEnabled(!oCharValueInput.getEnabled());
            }
            //The last added char is always set as not editable
            oLastAddedRow.getCells()[0].setEnabled(false);
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
        validateChar: function(sChar) {
            /**
             * Validates whether the input characteristic is a valid one.
             * This validation will happen server side in a productive environment, as one of the services 
             */
            let oModelChar = this.getView().getModel("characteristics").getData()["charModel"];
            let bExists = oModelChar.find((oElem) => oElem["char"] === sChar);
            return bExists;
            
        },

        _oNewAddFragment: null,

        onAddNewClass: async function(oEvent) {
            if (!this._oNewAddFragment) {
                this._oNewAddFragment = await Fragment.load({
                    id : this.getView().getId(),
                    name: "com.grilo.classification.com.grilo.classification.view.createClassDialog",
                    controller: this
                });
            }
            let oClassCharModel = this.getOwnerComponent().getModel("Classes");
            this._oNewAddFragment.setModel(oClassCharModel);
            let oClassCharFragmentBinding = this._oNewAddFragment.getBinding("items");
            let aFilters = []
            oClassCharFragmentBinding.aFilters = aFilters;
            let sClassType = this.getView().byId("detailObjectTypeInput").getValue();
            let oTypeFilter = new Filter({
                path: "classType",
                operator: FilterOperator.EQ,
                value1: sClassType
            });
            aFilters.push(oTypeFilter);
            oClassCharFragmentBinding.filter(aFilters);
            this._oNewAddFragment.open();
        },
        onConfirmItem: function(oEvent) {
            /*
            * Event when the item is selected. This needs to validate that the class already exists.
            *
            */
            let sClassWithDesc = oEvent.getParameter("selectedItem").getTitle();
            let sClass = sClassWithDesc.split("-")[0].trim();
            let sBindingPath = this.getView().getBindingContext().getPath()
            let aExistingClasses = this.getView().getModel().getProperty(sBindingPath)["classes"];
            // Note: this validation could be done directly against the model when creating.
            let bExistsClass = aExistingClasses.find((sExistingClass) => sExistingClass["class"] === sClass);
            if (bExistsClass) {
                MessageBox.show("Selected class already exists!", {
                    icon: MessageBox.Icon.ERROR,
                    title: "Error",
                    actions: MessageBox.Action.Close,
                });
            }
            this.getView().byId("detailClassSelect").setValue(oValue);
        }
    });
})