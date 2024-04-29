sap.ui.define([
    "zappvkt/controller/App.controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/library",
    "sap/m/MessagePopover",
    'sap/ui/table/Column',
    'sap/ui/model/FilterOperator',
    "sap/ui/model/Filter",
    "sap/m/MessageItem"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MLibrary, MessagePopover, UIColumn, FilterOperator, Filter, MessageItem,) {
        "use strict";

        var oMessagePopover;

        return Controller.extend("zappvkt.controller.View1", {
            onInit: function () {
                this.criaModeloAuxiliar()
            },

            criaModeloAuxiliar: function () {
                let oModel = new JSONModel()
                let objeto = {
                    Menssagens: [],
                    Editable: false
                }

                oModel.setData(objeto)
                this.getView().setModel(oModel, "Auxiliar")

                this.AlimentaModeloMenssagens()
            },

            AlimentaModeloMenssagens: function () {
                let oMessageTemplate = new MessageItem({
                    type: '{Auxiliar>type}',
                    title: '{Auxiliar>title}',
                    activeTitle: "{Auxiliar>active}",
                    description: '{Auxiliar>description}',
                    subtitle: '{Auxiliar>subtitle}',
                    counter: '{Auxiliar>counter}'
                });

                oMessagePopover = new MessagePopover({
                    items: {
                        path: 'Auxiliar>/Menssagens',
                        template: oMessageTemplate
                    },
                    activeTitlePress: function () {

                    }
                });

                var messagePopoverBtn = this.byId("messagePopoverBtn");

                if (messagePopoverBtn) {
                    this.byId("messagePopoverBtn").addDependent(oMessagePopover);
                }
            },

            onValueHelpCurso: function(){
                if (!this.pDialog) {
                    this.pDialog = this.loadFragment({
                        name: "zappvkt.view.fragmentos.ValueHelpIdCurso"
                    });
                }
                this.pDialog.then(function (oDialog) {
                    var oFilterBar = oDialog.getFilterBar();
                    this._oVHD = oDialog;
                    // Initialise the dialog with model only the first time. Then only open it
                    if (this._bDialogInitialized) {
                        // Re-set the tokens from the input and update the table
                        oDialog.open();
                        return;
                    }
                    this.getView().addDependent(oDialog);

                    // Set Basic Search for FilterBar
                    oFilterBar.setFilterBarExpanded(true);
                    oDialog.getTableAsync().then(function (oTable) {

                        oTable.setModel(this.oProductsModel);
                        // For Desktop and tabled the default table is sap.ui.table.Table
                        if (oTable.bindRows) {
                            // Bind rows to the ODataModel and add columns
                            oTable.bindAggregation("rows", {
                                path: "/ZshCursosVktSet",
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });
                            oTable.addColumn(new UIColumn({ label: "Idcurso", template: "Idcurso" }));
                            oTable.addColumn(new UIColumn({ label: "Nomecurso", template: "Nomecurso" }));
                            oTable.addColumn(new UIColumn({ label: "Duracao", template: "Duracao" }));
                        }

                        // For Mobile the default table is sap.m.Table
                        if (oTable.bindItems) {
                            // Bind items to the ODataModel and add columns
                            oTable.bindAggregation("items", {
                                path: "/ZshCursosVktSet",
                                template: new ColumnListItem({
                                    cells: [new Label({ text: "{Idcurso}" }), new Label({ text: "{Nomecurso}" }), new Label({ text: "{Duracao}" })]
                                }),
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });
                            oTable.addColumn(new MColumn({ header: new Label({ text: "Idcurso" }) }));
                            oTable.addColumn(new MColumn({ header: new Label({ text: "Nomecurso" }) }));
                            oTable.addColumn(new MColumn({ header: new Label({ text: "Duracao" }) }));
                        }
                        oDialog.update();
                    }.bind(this));

                    // set flag that the dialog is initialized
                    this._bDialogInitialized = true;
                    oDialog.open();
                }.bind(this));

            },

            onValueHelpCancelPressA: function(oEvent){
                this._oVHD.close();
            },

            onFilterBarSearchIdCurso: function (oEvent) {
                var aSelectionSet = oEvent.getParameter("selectionSet");

                var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                    if (oControl.getValue()) {
                        aResult.push(new Filter({
                            path: oControl.getName(),
                            operator: FilterOperator.Contains,
                            value1: oControl.getValue()
                        }));
                    }

                    return aResult;
                }, []);


                this._filterTableA(new Filter({
                    filters: aFilters,
                    and: true
                }));
            },

            _filterTableA: function (oFilter) {
                var oVHD = this._oVHD;

                oVHD.getTableAsync().then(function (oTable) {
                    if (oTable.bindRows) {
                        oTable.getBinding("rows").filter(oFilter);
                    }
                    if (oTable.bindItems) {
                        oTable.getBinding("items").filter(oFilter);
                    }

                    // This method must be called after binding update of the table.
                    oVHD.update();
                });
            },

            onValueHelpOkPressA: function(oEvent){
                var aTokens = oEvent.getParameter("tokens");
                var sIdcurso = aTokens[0].getProperty("key");
                this._user = this.byId("idCursosHelp");
                this._user.setValue(sIdcurso);
                this._oVHD.close();
            },

            onAdicionar: function () {
                if (!this.adicionar) {
                    this.adicionar = sap.ui.xmlfragment("zappvkt.view.fragmentos.Adicionar", this);
                    this.getView().addDependent(this.adicionar);
                }
                // open value help dialog filtered by the input value
                this.adicionar.open();
            },

            // CancelarAdicionar: function () {
            //     this.adicionar.close();
            // },

            // GravaAdicionar: function () {
            //     let that = this
            //     let oModel = this.getView().getModel()
            //     let oModelAuxiliar = this.getView().getModel("Auxiliar")
            //     let Usuario = this.adicionar.mAggregations.content[0].getValue()
            //     let Nome = this.adicionar.mAggregations.content[1].getValue()
            //     let Email = this.adicionar.mAggregations.content[2].getValue()
            //     let Projeto = this.adicionar.mAggregations.content[3].getValue()

            //     var oDados = {
            //         "Idcurso": Idcurso
            //     }

            //     this.getView().getModel().callFunction('/GetCursoExist', {                    
            //         method: "GET",
            //         urlParameters: oDados,
            //         success: function (oData, oReponse) {
            //             if (oData.Ok === '') {
            //                 sap.m.MessageBox.alert("Confirma a inclusão?", {
            //                     actions: ["Sim", "Não"],
            //                     onClose: function (sAction) {
            //                         if (sAction == "Sim") {
            //                             let objeto = {
            //                                 Idcurso: Idcurso,
            //                                 Nomecurso: Nomecurso,
            //                                 Duracao: Duracao
            //                             }
            //                             oModel.create('/CursosSet', objeto, {
            //                                 success: function (oData, oReponse) {
            //                                     let arrayMsg = {
            //                                         type: "Success",
            //                                         title: "Aluno incluido com sucesso !!!",
            //                                         activeTitle: true,
            //                                         description: "O aluno " + Usuario + " foi incluido com sucesso!!!",
            //                                     }
            //                                     // oModelAuxiliar.oData.Menssagens.push(arrayMsg);
            //                                     // oModelAuxiliar.refresh(true);

            //                                     // that.byId("messagePopoverBtn").setType("Accept");
            //                                     // oMessagePopover.openBy(that.getView().byId("messagePopoverBtn"));
            //                                     that.CancelarAdicionar()
            //                                 },
            //                                 error: function (oError) {
            //                                     // let arrayMsg = {
            //                                     //     type: "Error",
            //                                     //     title: "Erro ao incluir aluno !!!",
            //                                     //     activeTitle: true,
            //                                     //     description: "Erro ao incluir aluno " + Usuario + " !!!",
            //                                     // }
            //                                     // oModelAuxiliar.oData.Menssagens.push(arrayMsg);
            //                                     // oModelAuxiliar.refresh(true);

            //                                     // that.byId("messagePopoverBtn").setType("Accept");
            //                                     // oMessagePopover.openBy(that.getView().byId("messagePopoverBtn"));
            //                                 }
            //                             });
            //                         }
            //                     }
            //                 })
            //             } else {
            //                 sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("msgErroAlunoExist"));
            //             }
            //         },
            //         error: function (oError) {
            //             sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("lblMsgCreateError"));
            //         }
            //     });


            // },

        });

    });
