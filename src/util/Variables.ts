export class Variables {
    _counter = 0;
    private _vars: {[key: string]: string} = {};

    set(value: string) {
        this._counter += 1;
        const varName = "v" + this._counter.toString();
        this._vars[varName] = value;
        return "$" + varName;
    }
    get() {
        return this._vars;
    }
}

const vars = new Variables();

const expression = `node[@id=${vars.set("123")}]`;
const variables = vars.get();
