// ctrl+shift+f = blah

class KeybindsClass {
  bindings: any[][] = [];
  constructor() {
    document.addEventListener('keydown', (_event) => {
      print("Proccessing Event: ", _event.key, _event.ctrlKey, _event.shiftKey, _event.altKey)

      this.bindings.forEach((entry: any[]) => {
        let binding = entry[0]
        let callback = entry[1]

        let valid = binding.split('+').every((key: string) => {
          return (_event[key + "Key"]) || (_event.key.toLowerCase() == key.toLowerCase());
        })

        if (valid) {
          _event.preventDefault();
          _event.stopPropagation();
          callback(_event);
        }
      })
    })
  }


  bind(binding: string, callback: Function) {
    this.bindings.push([binding, callback])
  }
}

export const Keybinds = new KeybindsClass();