const model = require("../models/CurrencyRate");
const Controller = require("./Controller");

class CurrencyRateController extends Controller{
    constructor(props){
        super(props);
    }
}

module.exports = new CurrencyRateController({ model });