sap.ui.define([
    "zappvkt/controller/App.controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
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
    function (Controller, JSONModel, MessageBox, MLibrary, MessagePopover, UIColumn, FilterOperator, Filter, MessageItem,) {
        "use strict";

        var oMessagePopover;

        return Controller.extend("zappvkt.controller.Detalhe", {
            onInit: function () {
                this.criaModeloAuxiliar()
                this.getRouter().getRoute("RouteDet").attachPatternMatched(this._onObjectMatched, this);
            },

            criaModeloAuxiliar: function () {
                let oModel = new JSONModel()
                let objeto = {
                    Mensagens: [],
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
                        path: 'Auxiliar>/Mensagens',
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

            _onObjectMatched: function (oEvent) {
                let ModeloAuxiliar = new JSONModel()
                let objeto = {
                    editable: false,
                    visibleEdit: true,
                    visibleSave: false
                }
                ModeloAuxiliar.setData(objeto)
                this.getView().setModel(ModeloAuxiliar, "AuxiliarAluno")

                let id = oEvent.getParameter("arguments").Idcurso;

                this.getModel().refresh()
                this.getModel().metadataLoaded().then(function () {
                    var sObjectPath = this.getModel().createKey("CursosSet", {
                        Idcurso: id
                    });
                    this._bindView("/" + sObjectPath);
                }.bind(this));

                this._Idcurso = id;

                let Table = this.getView().byId("SmartTable");
                Table.rebindTable();

            },

            onBeforeRebindTable: function(oSource){
                var Idcurso = this._Idcurso;
                var binding = oSource.getParameter("bindingParams");
                var oFilter = new sap.ui.model.Filter("Idcurso", sap.ui.model.FilterOperator.EQ, Idcurso);
                binding.filters.push(oFilter);
            },

            _bindView: function (sObjectPath) {
                // Set busy indicator during view binding
                var oViewModel = this.getView().getModel();
                var that = this;
                // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
                oViewModel.setProperty("/busy", false);
                this.getView().bindElement({
                    path: sObjectPath,
                    events: {
                        change: this._onBindingChange.bind(this),
                        dataRequested: function () {
                            oViewModel.setProperty("/busy", true);
                        },
                        dataReceived: function () {
                            oViewModel.setProperty("/busy", false);
                        }
                    }
                });
            },

            _onBindingChange: function () {
                var oView = this.getView(),
                    oElementBinding = oView.getElementBinding();

                if (!oElementBinding.getBoundContext()) {

                    return;
                }

            },

            onCancela: function () {
                let oModel = this.getView().getModel()
                oModel.refresh()

                let that = this
                sap.m.MessageBox.alert("Deseja realmente sair?", {
                    actions: ["Sim", "Não"],
                    onClose: function (sAction) {
                        let oModelAuxiliar = that.getView().getModel("Auxiliar")
                        let oData = oModelAuxiliar.getData()

                        oData.editable = false
                        oData.visibleEdit = true
                        oData.visibleSave = false
                        oModelAuxiliar.refresh()
                    }
                })

            },

            onAdiciona: function () {
                if (!this.adicionar) {
                    this.adicionar = sap.ui.xmlfragment("zappvkt.view.fragmentos.AddAluno", this);
                    this.getView().addDependent(this.adicionar);
                }
                // open value help dialog filtered by the input value
                this.adicionar.open();
            },

            CancelarAdicionar: function () {
                this.adicionar.close();
            },

            GravaAdicionar: function () {
                let that = this
                let oModel = this.getView().getModel()
                let oModelAuxiliar = this.getView().getModel("Auxiliar")
                let Idcurso = this._Idcurso;
                let Idaluno = this.adicionar.mAggregations.content[0].getValue()
                let Nomealuno = this.adicionar.mAggregations.content[1].getValue()
                let Ativo = this.adicionar.mAggregations.content[3].getSelected()

                var oDados = {
                    "Idcurso": this._Idcurso,
                    "Idaluno": Idaluno                   
                }

                this.getView().getModel().callFunction('/GetAlunoExist', {                    
                    method: "GET",
                    urlParameters: oDados,
                    success: function (oData, oReponse) {
                        if (oData.OK === '') {
                            sap.m.MessageBox.alert("Confirma a inclusão?", {
                                actions: ["Sim", "Não"],
                                onClose: function (sAction) {
                                    if (sAction == "Sim") {
                                        let objeto = {
                                            Idcurso: Idcurso,
                                            Idaluno: Idaluno,
                                            Nomealuno: Nomealuno,
                                            Ativo: Ativo
                                        }
                                        oModel.create('/AlunosSet', objeto, {
                                            success: function (oData, oResponse) {
                                                let arrayMsg = {
                                                    type: "Success",
                                                    title: "Aluno incluido com sucesso!",
                                                    activeTitle: true,
                                                    description: "O aluno " + Idaluno + "-" + Nomealuno +" foi incluido com sucesso!!!",
                                                }
                                                oModelAuxiliar.oData.Mensagens.push(arrayMsg);
                                                oModelAuxiliar.refresh(true);

                                                that.byId("messagePopoverBtn").setType("Accept");
                                                oMessagePopover.openBy(that.getView().byId("messagePopoverBtn"));
                                                that.CancelarAdicionar()
                                            },
                                            error: function (oError) {
                                                let arrayMsg = {
                                                    type: "Error",
                                                    title: "Erro ao incluir aluno!",
                                                    activeTitle: true,
                                                    description: "Erro ao incluir aluno " + Idaluno + "-" + Nomealuno +"!",
                                                }
                                                oModelAuxiliar.oData.Mensagens.push(arrayMsg);
                                                oModelAuxiliar.refresh(true);

                                                that.byId("messagePopoverBtn").setType("Accept");
                                                oMessagePopover.openBy(that.getView().byId("messagePopoverBtn"));
                                            }
                                        });
                                    }
                                }
                            })
                        } else {
                            sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("msgErroAlunoExist"));

                        }

                    },
                    error: function (oError) {
                        sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("lblMsgCreateAlError"));
                    }
                });

            },

            handleMessagePopoverPress: function () {
                oMessagePopover.openBy(this.getView().byId("messagePopoverBtn"));
            },

            onDeleta: function () {
                let that = this
                let oModel = this.getView().getModel()
                let oModelAuxiliar = this.getView().getModel("Auxiliar")
                let Table = this.getView().byId("idTable")
                let selecionados = Table.getSelectedContextPaths()
                if (selecionados.length > 0) {
                    sap.m.MessageBox.alert("Confirma a exclusão dos alunos selecionados?"  , {
                        actions: ["Sim", "Não"],
                        onClose: function (sAction) {
                            if (sAction == "Sim") {
                                let Indice
                                for (let i = 0; i < selecionados.length; i++) {
                                    Indice = selecionados[i]
                                    oModel.remove(Indice, {
                                        success: function () {
                                            let arrayMsg = {
                                                type: "Success",
                                                title: "Aluno excluido com sucesso",
                                                activeTitle: true,
                                                description: "O aluno com indice " + Indice + " foi excluido com sucesso!",
                                            }
                                            oModelAuxiliar.oData.Mensagens.push(arrayMsg);
                                            oModelAuxiliar.refresh(true);

                                            that.byId("messagePopoverBtn").setType("Accept");
                                            oMessagePopover.openBy(that.getView().byId("messagePopoverBtn"));
                                        },
                                        error: function (oError) {
                                            let arrayMsg = {
                                                type: "Error",
                                                title: "Erro ao excluir o aluno",
                                                activeTitle: true,
                                                description: "Erro ao excluir o aluno com indice " + Indice + "!",
                                            }
                                            oModelAuxiliar.oData.Mensagens.push(arrayMsg);
                                            oModelAuxiliar.refresh(true);

                                            that.byId("messagePopoverBtn").setType("Accept");
                                            oMessagePopover.openBy(that.getView().byId("messagePopoverBtn"));
                                        }
                                    })
                                }
                            }
                        }
                    })
                } else {
                    sap.m.MessageBox.error("Selecione um aluno para exclusão!!!")
                }
            },


        });
    });
