sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/ColumnListItem",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function(Controller, ColumnListItem, Input, Button, MessageBox, JSONModel, Fragment, Filter, FilterOperator, MessageToast) {
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
            let oSelectControl = this.getView().byId("detailClassSelect");
            let oCharTable = this.getView().byId("classTable");
            // Clear the table binding whenever the view is called again. It will be rebound in the class selection.
            oCharTable.unbindItems();
            this.getView().byId("removeClass").setVisible(false);  
            //also clear the selected value so the user can reinput that
            this.getView().byId("detailClassSelect").setSelectedItem(null);
            switch (sRouteName) {
                case ("RouteDetail"):
                    this._iObjectIndex = oEvent.getParameter("arguments")["id"];
                    let sBindEntry = `/objects/${this._iObjectIndex}`;
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
                    // In this case, use "UnbindProperty to correctly setup the input value"
                    // this includes cleaning any binding that depends on entries that exists in model.json
                    // oSelectControl.bindElement('/objects'); //clear the binding path.
                    oObjectId.unbindProperty("value");
                    oObjectId.setValue(sObjectId);
                    oObjectClassType.unbindProperty("value");
                    oObjectClassType.setValue(sObjectClassType);
                    this._setObjectDescription(sObjectId);
                    this._setObjectTypeDescription(sObjectClassType);
                    break;
                }
            
        },

        _iObjectIndex: null,

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

        onSelectedClass : function(oEvent) {
            /*
            * Callback method to select the characteristics when a class is selected. Essentially, this would trigger an oData call
            * to the backend upon selection. It also adds a "trash bin" button to delete the class assignment.
            *
            */
            let sClass = oEvent.getParameter("selectedItem").getProperty("key");
            let oTable = this.getView().byId("classTable");
            let oModel = this.getView().getModel()
            oTable.setModel(oModel);
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
                            ]
                })
            });
            //as soon as an entry is selected, the user can then create new entries or save them.
            let oClass = this.getView().byId("detailClassSelect").getSelectedItem()//getSelectedKey("")
            if (oClass) {
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
            let oBundle = this.getView().getModel("i18n").getResourceBundle();
            MessageToast.show(oBundle.getValue(ClassCharDelete));
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

        onSavePressed : async function(oEvent) {
            /**
             * This event will trigger the oData request to save the new characteristic in the backend.
             * As a mockup, it only adds to the current table 
             * @param {sap.ui.base.Event} oEvent - Event triggered when the save Button of the table toolbar is pressed
             */
            // in a real world scenario, this will be implemented in the callback request to the odata service
            // re-enable the other rows before adding the new one, otherwise the last one will be in a different state.
            let oTable = this.getView().byId("classTable");
            // this is the case we're adding a new characteristic to the model: because we're using a JSONModel, we need to append
            // the new content to the model itself. Note that this will NOT be the same treatment as if we were using a odata model.
            let oModel = this.getView().getModel();
            let sObjectId = this.getView().byId("detailObjectInput").getValue();
            let sObjectClassType = this.getView().byId("detailObjectTypeInput").getValue();
            let aModelData = oModel.getData()['objects'];
            // Build the entry in the corresponding format based on the model: object and type with class and its corresponding chars
            let oNewModelEntry = this._buildNewModelEntry();
            let aCurrentObjectClasses = aModelData.find((data) => data['object'] == sObjectId && data['classType'] == sObjectClassType);
            if (!aCurrentObjectClasses) {
                // add a new class for an equipment that does not have it (entry does not exist in the model)
                this._addNewClassChar(oNewModelEntry);
            }
            else {
                // add a new class for an equipment with already assigned classes (entry exists in the model)
                aCurrentObjectClasses["classes"].push(oNewModelEntry["classes"][0]);
                await this.getView().getModel().setProperty(`/objects/${this._iObjectIndex}`, aCurrentObjectClasses);
            }
            let oSelectControl = this.getView().byId("detailClassSelect");
            let oPickedClassId = this._currentPickedClass.split("-")[0];
            let iNewClass = oSelectControl.getItems().findIndex((oObject) => oObject.getKey() == oPickedClassId);
            if (!iNewClass) {
                return;
            }
            await this.getView().byId("detailClassSelect").setSelectedKey(oPickedClassId);
            let oItem = this.getView().byId("detailClassSelect").getSelectedItem();
            let oBundle = this.getView().getModel("i18n").getResourceBundle();
            let sClassCharSuccessful = oBundle.getText("ClassCharAssigned");
            MessageToast.show(sClassCharSuccessful);

        },

        _buildNewModelEntry: function() {
            let sClassIdAndDesc = this._currentPickedClass.split("-");
            let sObjectId = this.getView().byId("detailObjectInput").getValue();
            let sClassType = this.getView().byId("detailObjectTypeInput").getValue();
            let sClassId = sClassIdAndDesc[0];
            let sClassDesc = sClassIdAndDesc[1];
            let aCharsTableItems = this._getCharEntries();
            let aNewClassChar = [{
                "class": sClassId,
                "classDesc": sClassDesc,
                "chars": aCharsTableItems
            }]
            let oNewDataEntry = {
                "object" : sObjectId,
                "classType" : sClassType,
                "classTypeDesc": "", //this should get the class type description from the class model...
                "classes" : aNewClassChar
            }
            return oNewDataEntry;
        },

        _getCharEntries : function() {
            let aCharsTableItems = this.getView().byId("classTable").getItems();
            let aChars = [];
            for (let oEntry of aCharsTableItems) {
                let oEntryCells = oEntry.getCells();
                aChars.push({
                    "charId": oEntryCells[0].getValue(),
                    "charValue": oEntryCells[1].getValue(),
                    "charUom": oEntryCells[2].getValue()
                });
            }
            return aChars;
        },

        _addNewClassChar: async function(oNewDataEntry) {
            /**
             * Gets the screen controls related with the input of the new class, and add it to the model.
             * @param {Array} aData - the data of the main model (which would be of type sap.ui.model.json.JSONModel)
             */
            let oModel = this.getView().getModel();
            let aNewData = oModel.getData()["objects"];
            aNewData.push(oNewDataEntry);
            let oUpdatedModel = {
                "objects" : aNewData
            }
            oModel.setData(oUpdatedModel);


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

        _currentPickedClass : null,

        onConfirmItem: function(oEvent) {
            /*
            * Event callback when the item is selected. This needs to validate that the class already exists.
            * @param {sap.ui.base.Event} oEvent - Event triggered when the item is selected in the SelectDialog
            *
            */
            let sClassWithDesc = oEvent.getParameter("selectedItem").getTitle();
            let sObject = this.getView().byId("detailObjectInput").getValue();
            let sClass = sClassWithDesc.split("-")[0].trim();
            let oClassBindingContext = this.getView().getBindingContext()
            if (oClassBindingContext) {
                let sBindingPath = oClassBindingContext.getPath();
                // this is the scenario where the object already have a class assigned to it.
                // Note: this validation could be done directly against the model when creating.
                let aExistingClasses = this.getView().getModel().getProperty(sBindingPath)["classes"];
                let bExistsClass = aExistingClasses.find((sExistingClass) => sExistingClass["class"] === sClass);
                if (bExistsClass) {
                    MessageBox.show(`Selected class already assigned to object ${sObject}`, {
                        icon: MessageBox.Icon.ERROR,
                        title: "Error",
                        actions: MessageBox.Action.Close,
                    });
                    return;
                }
            }
            this.getView().byId("detailClassSelect").setValue(sClassWithDesc); 
            this._currentPickedClass = sClassWithDesc;
            //I think this is a private method that was forgotten as a public method. Perhaps open an issue?
            // TODO open an issue based on the above method. this should not be able to be used...
            // you need to add it to the binding manually, not to the screen control, by using the current jsonmodel before sending it back to the
            // oData service. But, if I do this before the 'save' button is clicked, then I might have a data issue as i'd update
            // the data model before the data is commited by the user (make sense?)
            this.getView().byId("removeClass").setVisible(false);
            let sClassId = sClassWithDesc.split("-")[0].trim();
            this._loadCharacteristics(sClassId);
        },

        _loadCharacteristics: function(sClass) {
            /**
             * Loads all characteristics upon creating a new class/characteristic assignemnt for the equipment.
             * @param {String} sClass - name of the class
             * 
             */
            let oMasterCharModel = this.getOwnerComponent().getModel("Classes");
            let oMasterCharModelData = oMasterCharModel.getData()["Classes"];
            let iClassId = oMasterCharModelData.findIndex((oClass) => oClass["class"] === sClass);
            if (!iClassId) {
                return;
            }
            let oCharTable = this.getView().byId("classTable");
            oCharTable.setModel(oMasterCharModel);
            let sBindingPath = `/Classes/${iClassId}/chars`;
            oCharTable.bindElement({
                path: sBindingPath,
                model: oMasterCharModel
            });
            oCharTable.bindAggregation("items", {
                path: sBindingPath,
                template: new ColumnListItem({
                    cells : [
                                new Input({
                                    value: "{charId}",
                                    editable: false,
                                }),
                                new Input({
                                    value: "{charValue}",
                                    editable: true
                                }),
                                new Input({
                                    value: "{charUom}",
                                    editable: false
                                }),
                            ]
                })
            });
        }
    });
})