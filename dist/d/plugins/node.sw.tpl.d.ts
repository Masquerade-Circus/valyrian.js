declare function fetchRequest(event: any): Promise<Response>;
declare let Log: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
declare namespace config {
    const version: string;
    const name: string;
    const urls: string[];
}
declare let cacheName: string;
