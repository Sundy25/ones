(function(){

    //桌面图标
    ones.pluginRegister("hook.dashboard.appBtn", function(injector, defer, $scope) {
        var ComView = injector.get("ComView");


        ones.pluginScope.append("dashboardAppBtns", {
            label: ComView.toLang("stockout"),
            name: "stockoutList",
            icon: "sign-out",
            link: "store/list/stockout",
            sort: 6
        });

        ones.pluginScope.append("dashboardAppBtns", {
            label: ComView.toLang("stockin"),
            name: "stockinList",
            icon: "sign-in",
            link: "store/list/stockin",
            sort: 4
        });

        ones.pluginScope.append("dashboardAppBtns", {
            label: ComView.toLang("stock_warning"),
            name: "stockWarningList",
            icon: "warning",
            link: "store/list/stockWarning",
            sort: 3
        });

        //未处理入库单
        var stockInRes = injector.get("StockinRes");
        stockInRes.query({
            unhandled: true,
            onlyCount: true
        }).$promise.then(function(data){
            var count = parseInt(data[0].count);
            if(count <= 0) {
                return;
            }
            ones.pluginScope.get("dashboardSetBtnTip")("stockinList", count);
        });

        //未处理出库单
        var stockOutRes = injector.get("StockoutRes");
        stockOutRes.query({
            unhandled: true,
            onlyCount: true
        }).$promise.then(function(data){
            var count = parseInt(data[0].count);
            if(count <= 0) {
                return;
            }
            ones.pluginScope.get("dashboardSetBtnTip")("stockoutList", count);
        });

        //库存警告
        var stockWarningAPI = injector.get("Store.StockWarningAPI");
        stockWarningAPI.api.query({
            unhandled: true,
            onlyCount: true
        }).$promise.then(function(data){
            var count = parseInt(data[0].count);
            if(count <= 0) {
                return;
            }
            ones.pluginScope.get("dashboardSetBtnTip")("stockWarningList", count);
        });

        ones.pluginScope.set("defer", defer);
    });

    //综合搜索
    ones.pluginRegister("hook.multiSearch.items", function(inject, defer, params){
        ones.pluginScope.append("ones.multiSearch.items", {
            name: "stockin",
            dataSource: "StockinRes",
            labelField: "bill_id",
            linkTpl: "store/editBill/stockin/id/+id",
            link: "store/list/stockin"
        });
        ones.pluginScope.append("ones.multiSearch.items", {
            name: "stockout",
            dataSource: "StockoutRes",
            labelField: "bill_id",
            linkTpl: "store/editBill/stockout/id/+id",
            link: "store/list/stockout"
        });
    });

    //桌面块
    ones.pluginRegister("hook.dashboard.blocks", function(injector, defer, params) {
        ones.pluginScope.append("dashboardBlocks", {
            name: "latestStockin",
            template: appView("stockin/dashboardLatestStockin.html", "store"),
            width:4
        });
        ones.pluginScope.append("dashboardBlocks", {
            name: "latestStockout",
            template: appView("stockout/dashboardLatestStockout.html", "store"),
            width:4
        });
        ones.pluginScope.append("dashboardBlocks", {
            name: "needStockout",
            template: appView("stockout/dashboardNeedStockout.html", "store"),
            width:4
        });
    });


    angular.module("ones.store", [])
        .config(["$routeProvider", function($route){
            $route
                //入库
                .when('/store/addBill/stockin', {
                    templateUrl: appView("stockin/edit.html", "store"),
                    controller: 'StockinEditCtl'
                })
                .when('/store/editBill/stockin/id/:id', {
                    templateUrl: appView("stockin/edit.html", "store"),
                    controller: 'StockinEditCtl'
                })
                //出库
                .when('/store/addBill/stockout', {
                    templateUrl: appView("stockout/edit.html", "store"),
                    controller: 'StockoutEditCtl'
                })
                .when('/store/editBill/stockout/id/:id', {
                    templateUrl: appView("stockout/edit.html", "store"),
                    controller: 'StockoutEditCtl'
                })
                //库存列表
                .when('/store/export/stockProductList', {
                    templateUrl: appView("stockProductList/export.html", "store"),
                    controller: 'StockProductsExportCtl'
                })
                //库存警告
                .when('/store/list/StockWarning', {
                    templateUrl: 'common/base/views/grid.html',
                    controller: 'StockWarningCtl'
                })
                //工作流
                .when('/doWorkflow/Stockout/confirm/:nodeId/:id', {
                    controller: "WorkflowConfirmStockoutCtl",
                    templateUrl: appView("stockout/confirmStockout.html", "store")
                })
                .when('/doWorkflow/Stockin/confirm/:nodeId/:id', {
                    controller: "WorkflowConfirmStockinCtl",
                    templateUrl: appView("stockin/confirmStockin.html", "store")
                })
            ;
        }])
        .factory("StockinRes", ["$resource", "ones.config", function($resource, cnf) {
            return $resource(cnf.BSU + "store/stockin/:id.json", null,
                {
                    'doWorkflow': {method: 'GET'},
                    'doPostWorkflow': {method: 'POST'},
                    'update': {method: 'PUT'}
                });
        }])

        .factory("StockoutRes", ["$resource", "ones.config", function($resource, cnf) {
            return $resource(cnf.BSU + "store/stockout/:id.json", null,
                {
                    'doWorkflow': {method: 'GET'},
                    'doPostWorkflow': {method: 'POST'},
                    'update': {method: 'PUT'}
                });
        }])


        .service("Store.StockAPI", ["$rootScope", "$q", "ones.dataApiFactory", function($rootScope, $q, dataApiFactory){
            this.structure = {
                id: {
                    primary: true,
                    displayName: "ID"
                },
                name: {
                    ensureunique: "Store.StockAPI"
                },
                managers_name: {
                    displayName: toLang("stockManager", "", $rootScope),
                    hideInForm:true
                },
                managers: {
                    displayName: toLang("stockManager", "", $rootScope),
                    nameField: "truename",
                    valueField: "id",
                    inputType: "select",
                    multiple: "multiple",
                    remoteDataField: "managers",
                    listAble:false,
                    dataSource: "Department.UserAPI",
                    hideInDetail:true
                },
                total_num: {
                    displayName: l('lang.total'),
                    hideInForm: true
                }
            };
            this.getStructure = function(){
                return this.structure;
            };
            this.api = dataApiFactory.getResourceInstance({
                uri: "store/stock"
            });
        }])
        .service("Store.StockProductListAPI", ["$rootScope", "pluginExecutor", "ones.dataApiFactory",
            function($rootScope, plugin, dataAPI){
                var self = this;
                this.config = {
                    deleteAble: false,
                    exportAble: true
                };
                this.api = dataAPI.getResourceInstance({
                    uri: "Store/StockProductList"
                });
                this.getStructure = function(){
                    plugin.callPlugin("bind_dataModel_to_structure", {
                        structure: self.structure,
                        after: "goods_name",
                        alias: "product",
                        require: ["goods_id"],
                        queryExtra: ["goods_id"],
                        config: {
                            hideInForm: true
                        }
                    });
                    return ones.pluginScope.get("defer").promise;
                };
                this.structure = {
                    factory_code_all: {
                        hideInForm: true,
                        billAble:false
                    },
                    goods_name: {
                        inputType: "static",
                        hideInForm: true
                    },
                    unit_price: {
                        cellFilter: "currency:'￥'",
                        inputType: "number"
                    },
                    cost: {
                        cellFilter: "currency:'￥'",
                        inputType: "number"
                    },
                    category_name: {
                        hideInForm: true,
                        displayName: toLang("category", "", $rootScope)
                    },
                    stock_name: {
                        inputType: "static",
                        displayName: toLang("stock", "", $rootScope),
                        hideInForm: true
                    },
                    num: {
                        hideInForm: true,
                        displayName: toLang("storeNum", "", $rootScope),
                        cellFilter:"colorize:item.colorize"
                    },
                    measure: {
                        hideInForm: true
                    },
                    store_min: {
                        inputType: "number"
                    },
                    store_max: {
                        inputType: "number"
                    }
                };
            }])

        .service("StockProductExportModel", ["$rootScope", "GoodsCategoryRes", "$q",
            function($rootScope, GoodsCategoryRes, $q) {
                var service = {
                    getStructure : function() {
                        var i18n = l('lang');
                        var struct = {
                            stock: {
                                inputType: "select",
                                required: false,
                                multiple: true,
                                dataSource: "Store.StockAPI"
                            },
                            category: {
                                inputType: "select",
                                multiple: true,
                                nameField: "prefix_name",
                                dataSource: "GoodsCategoryRes"
                            },
                            stockWarningOnly: {
                                inputType: "select",
                                dataSource: [
                                    {
                                        id: 1,
                                        name: i18n.yes
                                    },
                                    {
                                        id: -1,
                                        name: i18n.no
                                    }
                                ],
                                required: false
                            }
                        };
                        return struct;
                    }
                };
                return service;
            }])
        .service("StockinModel", ["$rootScope", function($rootScope){
            var startTime = new Date();
            var endTime = new Date();
            startTime.setMonth(startTime.getMonth()-1);
            var obj = {
                config: {
                    isBill: true,
                    printAble: true,
                    printTitle: toLang("stockin", "", $rootScope),
                    rowsModel: "StockinDetailModel",
                    workflowAlias: "stockin",
                    trashAble: true,
                    filters: {
                        between: {
                            field: "dateline",
                            defaultData: [startTime, endTime],
                            inputType: "datetime"
                        },
                        workflow: "stockin"
                    },
                    extraPageActions: [
                        {
                            label: toLang("viewDetail", "actions", $rootScope),
                            class: "primary",
                            href : "/store/list/stockinDetail"
                        }
                    ]
                }
            };
            obj.getStructure= function() {
                var i18n = l("lang");
                return {
                    bill_id: {
                        displayName: i18n.billId
                    },
                    subject: {},
                    source_model: {
                        cellFilter: "lang"
                    },
                    total_num: {},
                    ined_num: {},
                    dateline: {
                        cellFilter: "dateFormat:0"
                    },
                    status_text: {
                        displayName: i18n.status,
                        field: "processes.status_text"
                    },
                    sponsor: {},
                    stock_manager_name: {
                        displayName: i18n.stockManager
                    }
                };
            };

            return obj;
        }])
        .service("StockinDetailModel", ["$rootScope", "GoodsRes","pluginExecutor", "ones.dataApiFactory",
            function($rootScope, GoodsRes, plugin, dataAPI) {
                var obj = {
                    config: {
                        printAble: true,
                        isBill:true,
                        workflowAlias: "stockin"
                    },
                    api: dataAPI.getResourceInstance({
                        "uri" : "store/stockinDetail"
                    })
                };
                obj.getStructure = function() {
                    var i18n = l('lang');
                    var fields = {
                        id : {
                            primary: true,
                            billAble: false
                        },
                        factory_code_all: {
                            billAble:false,
                            hideInForm:true,
                            printAble: true
                        },
                        goods_name: {
                            printAble: true,
                            billAble: false,
                            hideInForm:true
                        },
                        goods_id: {
                            displayName: i18n.goods,
                            labelField: true,
                            inputType: "select3",
                            dataSource: GoodsRes,
                            valueField: "combineId",
                            nameField: "combineLabel",
                            listAble: false,
                            width: 300,
                            dynamicAddOpts: {
                                model: "GoodsModel"
                            }
                        },
                        stock: {
                            editAbleRequire: ["goods_id"],
                            inputType: "select3",
                            dataSource: "Store.StockAPI",
                            autoQuery: true,
                            autoReset: true,
                            autoHide: true,
                            printAble: true
                        },
                        store_num: {
                            displayName: i18n.storeNum,
                            editAble:false,
                            min: -9999,
                            listAble: false
                        },
                        total_num: {
                            inputType: "static",
                            onlyInEdit: true,
                            printAble: true,
                            listAble: false,
                            totalAble: true
                        },
                        num: {
                            inputType: "number",
                            totalAble: true,
                            displayName: l("this_time_in_stock")
                        },
                        ined: {
                            inputType: "static",
                            onlyInEdit: true,
                            totalAble: true
                        },
                        memo: {
                            printAble: true
                        }

                    };

                    plugin.callPlugin("bind_dataModel_to_structure", {
                        structure: fields,
                        alias: "product",
                        require: ["goods_id"],
                        queryExtra: ["goods_id"]
                    });

                    return ones.pluginScope.get("defer").promise;
                };


                return obj;
            }])
        .service("Store.StockWarningAPI", ["$rootScope", "pluginExecutor", "ones.dataApiFactory", function($rootScope, plugin, dataAPI){
            this.config = {
                editAble: false,
                deleteAble: false
            };
            this.api = dataAPI.getResourceInstance({
                uri: "store/stockWarning",
                extraMethod: {}
            });
            this.structure = {
                factory_code_all: {
                    displayName: toLang("factoryCodeAll", "", $rootScope)
                },
                goods_name: {
                    displayName: toLang("name", $rootScope)
                },
                measure: {},
                category_name: {
                    displayName: toLang("category", $rootScope)
                },
                stock_name: {
                    displayName: toLang("stock", $rootScope)
                },
                num: {
                    cellFilter:"colorize:item.colorize"
                },
                store_min: {},
                store_max: {}
            };

            this.getStructure = function(){
                plugin.callPlugin("bind_dataModel_to_structure", {
                    structure: this.structure,
                    alias: "product",
                    after: "goods_name"
                });

                return ones.pluginScope.get("defer").promise;
            };
        }])
        .service('StockoutModel', ["$rootScope", function($rootScope){
            var startTime = new Date();
            var endTime = new Date();
            startTime.setMonth(startTime.getMonth()-1);
            return {
                config: {
                    isBill: true,
                    printAble: true,
                    printTitle: toLang("stockout", "", $rootScope),
                    rowsModel: "StockoutDetailModel",
                    workflowAlias: "stockout",
                    filters: {
                        between: {
                            field: "dateline",
                            defaultData: [startTime, endTime],
                            inputType: "datetime"
                        }
                    },
                    extraPageActions: [
                        {
                            label: toLang("viewDetail", "actions", $rootScope),
                            class: "primary",
                            href : "/store/list/stockoutDetail"
                        }
                    ]
                },
                getStructure: function(){
                    return {
                        bill_id : {},
                        source_model: {
                            cellFilter: "lang"
                        },
                        total_num: {},
                        outed_num: {},
                        stock_manager: {},
                        dateline: {
                            cellFilter: "dateFormat:0"
                        },
                        status_text: {
                            displayName: l('lang.status'),
                            field: "processes.status_text"
                        },
                        outtime: {
                            displayName: l('lang.outStockTime'),
                            cellFilter: "dateFormat:0"
                        }
                    };
                }
            };
        }])
        .service("StockoutDetailModel", ["$rootScope","pluginExecutor", "ones.dataApiFactory",
            function($rootScope, plugin, dataAPI) {
                var obj = {
                    config: {
                        isBill: true,
                        printAble: true,
                        editAble: false,
                        deleteAble: false,
                        workflowAlias: "stockout"
                    },
                    api: dataAPI.getResourceInstance({
                        "uri" : "store/stockoutDetail"
                    })
                };
                obj.getStructure = function() {
                    var i18n = l('lang');
                    var fields = {
                        id : {
                            primary: true,
                            billAble: false,
                            listAble: false
                        },
                        bill_id : {
                            hideInForm: true,
                            billAble: false,
                            cellFilter: "toLink:store/editBill/stockout/id/+stockout_id"
                        },
                        factory_code_all: {
                            billAble:false,
                            hideInForm:true,
                            printAble: true
                        },
                        goods_name: {
                            printAble: true,
                            billAble: false,
                            hideInForm:true,
                            listAble: true
                        },
                        goods_id: {
                            displayName: i18n.goods,
                            labelField: true,
                            inputType: "select3",
                            dataSource: "GoodsRes",
                            valueField: "combineId",
                            nameField: "combineLabel",
                            listAble: false,
                            width: 300,
                            dynamicAddOpts: {
                                model: "GoodsModel"
                            }
                        },
                        stock: {
                            editAbleRequire: ["goods_id"],
                            inputType: "select3",
                            dataSource: "Store.StockAPI",
                            autoQuery: true,
                            autoReset: true,
                            autoHide: true,
                            printAble: true,
                            listAble: false
//                            "ui-event": '{mousedown: onStockBlur(window.this, $event, this), keydown:  onStockBlur(window.this, $event, this)}'
                        },
                        stock_name: {
                            displayName: toLang("stock", "", $rootScope),
                            hideInForm:true,
                            billAble: false
                        },
                        store_num: {
                            displayName: i18n.storeNum,
                            editAble:false,
                            min: -9999,
                            listAble: false
                        },
                        total_num: {
                            inputType: "static",
                            onlyInEdit: true,
                            printAble: true,
                            listAble: false,
                            totalAble: true
                        },
                        num: {
                            inputType: "number",
                            totalAble: true,
                            displayName: toLang("this_time_out_stock", "", $rootScope)
                        },
                        outed: {
                            inputType: "static",
                            onlyInEdit: true,
                            totalAble: true
                        },
                        outtime: {
                            hideInForm: true,
                            billAble: false,
                            cellFilter: "dateFormat:0"
                        },
                        memo: {
                            printAble: true
                        }

                    };

                    plugin.callPlugin("bind_dataModel_to_structure", {
                        structure: fields,
                        alias: "product",
                        require: ["goods_id"],
                        queryExtra: ["goods_id"]
                    });

                    return ones.pluginScope.get("defer").promise;
                };


                return obj;
            }])

        .controller("StockinEditCtl", ["$scope", "StockinRes", "StockinModel", "ComView", "$routeParams",
            function($scope, StockinRes, StockinModel, ComView, $routeParams) {

                $routeParams.group = "store";
                $routeParams.module = "stockin";

                ComView.makeDefaultPageAction($scope, "store/stockin", null, StockinModel);

                $scope.workflowAble = true;
                $scope.selectAble = false;
                $scope.showWeeks = true;

                $scope.config = {
                    model: StockinModel,
                    resource: StockinRes
                };

                //入库类型字段定义
                $scope.typeSelectOpts = {
                    context: {
                        field: "type_id"
                    },
                    fieldDefine: {
                        inputType: "select",
                        "ng-model": "formMetaData.type_id",
                        dataSource: "HOME.TypesAPI",
                        queryParams: {
                            type: "stockin"
                        }
                    }
                };

                if(!$scope.formMetaData) {
                    $scope.formMetaData = {
                        dateline: new Date()
                    };
                }


            }])
        .controller("StockoutEditCtl", ["$scope", "StockoutRes", "StockoutModel", "ComView", "$routeParams",
            function($scope, res, model, ComView, $routeParams) {

                $routeParams.group = "store";
                $routeParams.module = "stockout";

                ComView.makeDefaultPageAction($scope, "store/stockout", [], model);
                $scope.workflowAble = true;
                $scope.selectAble = false;

                $scope.config = {
                    model: model,
                    resource: res
                };

                //出库类型字段定义
                $scope.typeSelectOpts = {
                    context: {
                        field: "type_id"
                    },
                    fieldDefine: {
                        inputType: "select",
                        "ng-model": "formMetaData.type_id",
                        dataSource: "HOME.TypesAPI",
                        queryParams: {
                            type: "stockout"
                        }
                    }
                };


                if(!$routeParams.id) {
                    $scope.formMetaData = {
                        dateline: new Date()
                    };
                }
            }])
        .controller("StockProductsExportCtl", ["$scope", "StockProductExportModel", "ComView", "$http", "ones.config",
            function($scope, StockProductExportModel, ComView, $http, cnf) {
                $scope.pageActions = [
                    {
                        label : $scope.i18n.lang.actions.list,
                        class : "primary",
                        href  : "/store/list/stockProductList"
                    }
                ];
                $scope.selectAble = false;
                $scope.formConfig = {
                    model: StockProductExportModel
                };

                $scope.doFormSubmit = function(){
//                    console.log($scope);return;
                    var url = cnf.BSU+'store/stockProductList/export/%s.json';
                    var params = {};
                    if($scope.formData.stock) {
                        params.stock = $scope.formData.stock;
                    }
                    params.category = $scope.formData.category;
                    params.warningonly = $scope.formData.stockWarningOnly;

                    url = sprintf(url, base64encode(angular.toJson(params)));
                    window.open(url);
                };
            }])

        //确认出库
        .controller("WorkflowConfirmStockoutCtl", ["$scope", "$routeParams", "ComView", "StockoutRes", "StockoutDetailModel", "$location",
            function($scope, $routeParams, ComView, res, model, $location){
                $scope.selectAble= false;

                $scope.config = {
                    model:model,
                    resource:res,
                    opts: {
                        queryExtraParams: {includeSource: true, workflowing: true}
                    },
                    doSubmit: function(){
                        $scope.formMetaData.rows = $scope.billData;
                        res.doPostWorkflow({
                            workflow: true,
                            node_id: $routeParams.nodeId,
                            id: $routeParams.id,
                            donext: true,
                            data: $scope.formMetaData
                        }).$promise.then(function(data){
//                    console.log(data);return;
                            $location.url("/store/list/stockout");
                        });
                    }
                };
            }])
        //确认入库
        .controller("WorkflowConfirmStockinCtl", ["$scope", "$routeParams", "ComView", "StockinRes", "StockinDetailModel", "$location", "$injector",
            function($scope, $routeParams, ComView, res, model, $location, $injector){
                $scope.selectAble= false;

                $scope.config = {
                    model:model,
                    resource:res,
                    opts: {
                        queryExtraParams: {includeSource: true, workflowing: true}
                    },
                    doSubmit: function(){
                        $scope.formMetaData.rows = $scope.billData;

                        var data = {
                            workflow: true,
                            node_id: $routeParams.nodeId,
                            id: $routeParams.id,
                            donext: true,
                            data: $scope.formMetaData
                        };
                        res.doPostWorkflow(data).$promise.then(function(data){
                            $location.url("/store/list/stockin");
                        });
                    }
                };
            }])


        .controller("DashboardStockinCtl", ["$scope", "StockinRes", function($scope, res){
            res.query({
                latest: true,
                limit: 5
            }).$promise.then(function(data){
                $scope.items = data;
            });
        }])

        .controller("DashboardStockoutCtl", ["$scope", "StockoutRes", function($scope, res){
            res.query({
                latest: true,
                limit: 5,
                handled: true
            }).$promise.then(function(data){
                $scope.items = data;
            });
        }])

        .controller("DashboardNeedStockoutCtl", ["$scope", "StockoutRes", function($scope, res){
            res.query({
                latest: true,
                unhandled: true,
                limit: 5
            }).$promise.then(function(data){
                $scope.items = data;
            });
        }])
    ;
})();