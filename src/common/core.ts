export function assert(truthy: any, message?: string) {
    if (!truthy) {
        throw new Error(message || "Assert error");
    }
}
