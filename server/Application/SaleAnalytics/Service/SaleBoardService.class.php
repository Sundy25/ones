<?php

/*
 * @app SaleAnalytics
 * @package SaleAnalytics.service.SaleBoard
 * @author laofahai@TEam Swift
 * @link https://ng-erp.com
 * */
namespace SaleAnalytics\Service;
use Common\Model\CommonModel;

class SaleBoardService extends CommonModel {

    protected $_auto = [
        ["user_info_id", "get_current_user_id", 1, "function"],
        ["company_id", "get_current_company_id", 1, "function"]
    ];

}