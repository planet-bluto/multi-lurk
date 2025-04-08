export default class PlayerEvent extends Event {
  channel: string

  constructor(type, channel) {
    super(type)
    this.channel = channel
  }
}