class ArrayUtils {
    public toDictionary<T = any, U = any>(array: T[], keyFunction: (obj: T) => string, valueFunction: (obj: T) => U = null): { [key: string]: U } {
        if (!array || array.length == 0) {
            return {};
        }
        const dictionary = Object.assign({}, ...array.map((x) => ({ [keyFunction(x)]: valueFunction ? valueFunction(x) : x })));
        return dictionary;
    }

    public toGroups<T = any>(array: T[], keyFunction: (obj: T) => string): { [key: string]: T[] } {
        if (!array || array.length == 0) {
            return {};
        }
        const groups: { [key: string]: T[] } = {};
        array.forEach((a) => {
            const key = keyFunction(a);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(a);
        });
        return groups;
    }

    public sum(array: number[]): number {
        if (!array || array.length == 0) {
            return 0;
        }
        return array.reduce((p, c) => p + c, 0);
    }

    public sumAction<T = any>(array: T[], action: (el: T) => number): number {
        if (!array || array.length == 0) {
            return 0;
        }
        return array.map((a) => action(a)).reduce((p, c) => p + c, 0);
    }
}

export default new ArrayUtils();
