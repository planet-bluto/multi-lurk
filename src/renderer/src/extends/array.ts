declare global {
    interface Array<T> {
        shuffle(): void;
        random(): any;
        awaitForEach(func: Function): Promise<T>;
        asyncForEach(func: Function): Promise<T>;
        remove(index: number): any;
        move(from: number, to: number): void;
        pat(entry: any): void;
        remove_duplicates(): Array<T>;
    }
}

export {}