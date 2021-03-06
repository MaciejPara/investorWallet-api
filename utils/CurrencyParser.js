const FindOrCreateRecords = require("../utils/FindOrCreateRecords");
const Currency = require("./Currency");
const CurrencyModel = require("../models/Currency");
const cheerio = require("cheerio");

class CurrencyParser {
    static fetchType = "text";

    constructor(data) {
        // if(!rates) throw new Error("Data are not valid currency object");
        //
        this._rates = {};
        this._base = "PLN";
        this._date = new Date(); // @todo get from site

        this.fields = [
            {
                name: "name",
                selector: "tr .textAlignRight a",
                values: [],
            },
            {
                name: "rate",
                selector: "td.colKurs",
                values: [],
            },
            {
                name: "time",
                selector: ".boxHeader .time",
                values: [],
            },
        ];

        this.$ = cheerio.load(data);
        this.parseHTML();
    }

    parseHTML() {
        this.fields.forEach(({ selector, values }) => {
            const elements = this.$(selector);
            elements.map((item) => {
                values.push(this.$(elements[item]).text());
            });
        });

        const names = this.fields.find(({ name }) => name === "name");
        const rates = this.fields.find(({ name }) => name === "rate");
        let time = this.fields
            .find(({ name }) => name === "time")
            ?.values[0].split(" ");

        this._date = new Date(time[time.length - 1]);

        if (names && rates) {
            names.values.forEach((name, index) => {
                this._rates[name] = parseFloat(
                    rates.values[index].replace(",", "."),
                );
            });
        }
    }

    getBase() {
        return this._base;
    }

    getDate() {
        return this._date;
    }

    getCurrenciesNames() {
        return Object.keys(this._rates);
    }

    /**
     * @returns {object} - data to save in db
     * */
    getDataToStore() {
        const names = this.getCurrenciesNames();
        const rates = names.map(
            (item) =>
                new Currency({
                    name: item,
                    rate: this._rates[item].toFixed(2),
                }),
        );

        const pln = {
            rates,
            date: this.getDate(),
            base: "PLN",
        };

        const usd = {
            rates: [],
            date: this.getDate(),
            base: "USD",
        };

        const usdPrice = rates.find(({ name }) => name === "USD")?.rate;

        if (usdPrice) {
            usd.rates = pln.rates
                .filter(({ name }) => name !== "USD")
                .map((item) => {
                    const result = { ...item };
                    result.rate = parseFloat(result.rate / usdPrice).toFixed(2);
                    return result;
                });

            usd.rates.push({
                name: "PLN",
                rate: parseFloat(1 / usdPrice).toFixed(2),
            });
        }

        return [pln, usd];
    }

    /**
     * saves currencies names into db collection
     * */
    async saveNewRecords() {
        try {
            await new FindOrCreateRecords({
                findElements: [...this.getCurrenciesNames(), "PLN"],
                model: CurrencyModel,
                match: "name",
                createSchema: {
                    name: "string",
                },
            }).exec();
        } catch (e) {
            throw e;
        }
    }
}

module.exports = CurrencyParser;
