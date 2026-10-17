/**
 * Calculates the byte length of a base64 string
 */
export declare function byteLength(b64: string): number;
/**
 * Converts base64 string to Uint8Array
 */
export declare function toByteArray(b64: string, removeLinebreaks?: boolean): Uint8Array;
/**
 * Converts Uint8Array to base64 string
 */
export declare function fromByteArray(uint8: Uint8Array, urlSafe?: boolean): string;
/**
 * Base64 encode a string
 * @deprecated Use native btoa() instead - now supported in Hermes
 */
export declare function btoa(data: string): string;
/**
 * Base64 decode a string
 * @deprecated Use native atob() instead - now supported in Hermes
 */
export declare function atob(b64: string): string;
/**
 * Adds btoa and atob to global scope
 */
export declare function shim(): void;
/**
 * Returns native base64 functions
 */
export declare const getNative: () => {
    base64FromArrayBuffer: (data: string | ArrayBuffer, urlSafe?: boolean) => string;
    base64ToArrayBuffer: (data: string, removeLinebreaks?: boolean) => ArrayBuffer;
};
/**
 * Removes padding characters from base64 string
 */
export declare const trimBase64Padding: (str: string) => string;
//# sourceMappingURL=index.d.ts.map