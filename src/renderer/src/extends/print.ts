const Printer = {
    print: print.bind(this)
}

declare global {
    // type print = (...args: any[]) => void
    function print(...args: any[]): void
    function print_to_printer(...args: any[]): void
}

Window.prototype.print = console.log
window.print = console.log
window.print_to_printer = Printer.print

export {}