export function assert(truthy: any, message?: string) {
    if (!truthy) {
        throw new Error(message || "Assert error");
    }
}

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}
