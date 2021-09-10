class ArrayUtils {
    public toDictionary<T = any, U = any>(array: T[], keyFunction: (obj: T) => string, valueFunction: (obj: T) => U = null): { [key: string]: U } {
        if (!array || array.length == 0) {
            return {};
        }
        const dictionary = Object.assign({}, ...array.map((x) => ({ [keyFunction(x)]: valueFunction ? valueFunction(x) : x })));
        return dictionary;
    }
}

export default new ArrayUtils();
